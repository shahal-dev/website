<script setup lang="ts">
import { geoMercator, geoPath, geoContains } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform, type D3ZoomEvent } from 'd3-zoom'
import { tile as d3Tile } from 'd3-tile'
import { feature } from 'topojson-client'
// Side-effect import: this is what puts .transition() on a d3 selection.
import 'd3-transition'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

/**
 * The shooting sites behind the photographs, on a zoomable D3 map.
 *
 * The basemap is raster tiles, so zooming in keeps revealing detail — regions,
 * towns, then roads — rather than bottoming out at a fixed set of country
 * outlines. Countries a photo was taken in are tinted on top of the tiles at
 * the zoom levels where a country is still a meaningful unit.
 *
 * Two shapes: the gallery passes every photo and gets the full map; a photo
 * page passes one and gets a compact card centred on that spot.
 */

export interface MapPhoto {
  slug: string
  path: string
  title: string
  thumb: string
  alt: string
  date?: string
  location?: string
  lat?: number | null
  lng?: number | null
}

const props = withDefaults(defineProps<{
  photos: MapPhoto[]
  /** Small, chrome-free version for a single photo's page. */
  compact?: boolean
  /** Heading above the map. Ignored when compact. */
  heading?: string
}>(), {
  compact: false,
  heading: 'Where I stood'
})

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const TAU = Math.PI * 2
const TILE_SIZE = 256
/** k is the width of the whole world in pixels: k = 256 · 2^z. */
const zoomToK = (z: number) => TILE_SIZE * 2 ** z
const MAX_K = zoomToK(17)

// ---------------------------------------------------------------------------
//  Sites
// ---------------------------------------------------------------------------
interface Site {
  id: string
  label: string
  lat: number
  lng: number
  photos: MapPhoto[]
}

/** Sites within ~1 km of each other are the same site. */
const KEY_PRECISION = 2

const sites = computed<Site[]>(() => {
  const byKey = new Map<string, Site>()
  for (const photo of props.photos) {
    // Not `Number(photo.lat)` on its own — Number(null) is 0, which would put
    // every un-pinned photo in the Gulf of Guinea.
    if (photo.lat === null || photo.lat === undefined) continue
    if (photo.lng === null || photo.lng === undefined) continue
    const lat = Number(photo.lat)
    const lng = Number(photo.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const key = `${lat.toFixed(KEY_PRECISION)},${lng.toFixed(KEY_PRECISION)}`
    const site = byKey.get(key)
    if (site) {
      site.photos.push(photo)
      continue
    }
    byKey.set(key, { id: key, label: photo.location || 'Unnamed site', lat, lng, photos: [photo] })
  }
  // Busiest sites first so their pins land on top of quieter ones.
  return [...byKey.values()].sort((a, b) => b.photos.length - a.photos.length)
})

const hasSites = computed(() => sites.value.length > 0)
const totalPinned = computed(() => sites.value.reduce((sum, site) => sum + site.photos.length, 0))

// ---------------------------------------------------------------------------
//  Web Mercator, in unit coordinates
//  A point becomes [0..1, 0..1]; the zoom transform turns that into pixels, so
//  tiles, country outlines and pins all share one coordinate system.
// ---------------------------------------------------------------------------
function toUnit(lng: number, lat: number): [number, number] {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat))
  const sin = Math.sin((clamped * Math.PI) / 180)
  return [
    (lng + 180) / 360,
    0.5 - Math.log((1 + sin) / (1 - sin)) / (2 * TAU)
  ]
}

// ---------------------------------------------------------------------------
//  Canvas size — driven by the element, so it reflows with the viewport
// ---------------------------------------------------------------------------
const wrapper = ref<HTMLElement | null>(null)
/** Measured width of the panel; 0 until the first observation. */
const measured = ref(0)
let observer: ResizeObserver | null = null

const size = computed(() => {
  const w = Math.max(280, Math.round(measured.value) || 800)
  const h = props.compact
    ? Math.round(Math.min(320, Math.max(200, w * 0.5)))
    : Math.round(Math.min(620, Math.max(300, w * 0.6)))
  return { w, h }
})

/** Never zoom out past the point where the world stops filling the panel. */
const minK = computed(() => Math.max(size.value.w, size.value.h))

// ---------------------------------------------------------------------------
//  Zoom state
// ---------------------------------------------------------------------------
const svg = ref<SVGSVGElement | null>(null)
const transform = ref<ZoomTransform>(zoomIdentity)
/** Once the visitor has moved the map, stop re-fitting it under them. */
const touched = ref(false)
/**
 * Nothing is drawn until the fitted transform is in place. At the identity
 * transform the world is one pixel wide, and d3-tile would answer with one
 * tile per pixel of width — hundreds of elements and hundreds of requests.
 */
const ready = ref(false)

/** The view the map opens at, and the one "Reset" goes back to. */
const homeTransform = computed<ZoomTransform>(() => {
  const { w, h } = size.value
  if (!hasSites.value) return zoomIdentity.translate(w / 2 - minK.value / 2, h / 2 - minK.value / 2).scale(minK.value)

  const units = sites.value.map(site => toUnit(site.lng, site.lat))
  const xs = units.map(u => u[0])
  const ys = units.map(u => u[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const padding = props.compact ? 0 : Math.min(w, h) * 0.18
  const spanX = maxX - minX
  const spanY = maxY - minY

  // One site (or several on top of each other) has no extent to fit, so pick a
  // zoom by hand: close enough on a photo page to read the town, wider on the
  // gallery so the place is recognisable.
  let k = spanX > 1e-9 || spanY > 1e-9
    ? Math.min(
        spanX > 1e-9 ? (w - 2 * padding) / spanX : Infinity,
        spanY > 1e-9 ? (h - 2 * padding) / spanY : Infinity
      )
    : zoomToK(6)

  k = Math.max(minK.value, Math.min(props.compact ? zoomToK(12) : zoomToK(9), k))

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return zoomIdentity.translate(w / 2 - cx * k, h / 2 - cy * k).scale(k)
})

const zoomBehaviour = d3Zoom<SVGSVGElement, unknown>()
  .translateExtent([[0, 0], [1, 1]])
  .filter((event: Event) => {
    // A bare wheel zooms, centred on the cursor — d3's default.
    if (event.type === 'wheel') return true
    // On touch, one finger stays page scroll; two fingers drive the map.
    if (event.type.startsWith('touch')) return ((event as TouchEvent).touches?.length || 0) >= 2
    return !(event as MouseEvent).button
  })
  .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
    transform.value = event.transform
    if (event.sourceEvent) touched.value = true
  })

function applyTransform(next: ZoomTransform, animate = false) {
  if (!svg.value) return
  const selection = select(svg.value)
  if (animate) selection.transition().duration(500).call(zoomBehaviour.transform, next)
  else selection.call(zoomBehaviour.transform, next)
}

onMounted(() => {
  // Measure first: the fitted transform below depends on the panel's size.
  if (wrapper.value) {
    measured.value = wrapper.value.clientWidth
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) measured.value = entry.contentRect.width
    })
    observer.observe(wrapper.value)
  }

  if (!svg.value) return
  zoomBehaviour
    .extent([[0, 0], [size.value.w, size.value.h]])
    .scaleExtent([minK.value, MAX_K])
  select(svg.value).call(zoomBehaviour)
  applyTransform(homeTransform.value)
  ready.value = true
})

onBeforeUnmount(() => observer?.disconnect())

// Re-fit on resize (and once the sites arrive) until the visitor takes over.
watch([homeTransform, () => size.value.w, () => size.value.h], () => {
  zoomBehaviour
    .extent([[0, 0], [size.value.w, size.value.h]])
    .scaleExtent([minK.value, MAX_K])
  if (!touched.value) applyTransform(homeTransform.value)
})

function resetView() {
  touched.value = false
  applyTransform(homeTransform.value, true)
}

function zoomBy(factor: number) {
  if (svg.value) select(svg.value).transition().duration(300).call(zoomBehaviour.scaleBy, factor)
}

const zoomLevel = computed(() => Math.log2(transform.value.k / TILE_SIZE))
const isHome = computed(() => {
  const a = transform.value
  const b = homeTransform.value
  return Math.abs(a.k - b.k) < 1 && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2
})

// ---------------------------------------------------------------------------
//  Raster basemap
//  CARTO's Positron/Dark Matter over OpenStreetMap data, switched with the
//  site's color mode. Attribution is required and rendered in the corner.
// ---------------------------------------------------------------------------
const tiles = computed(() => {
  const t = transform.value
  const empty = { list: [] as Array<{ key: string, url: string, x: number, y: number, size: number }> }
  if (!ready.value || t.k < minK.value) return empty

  const layout = d3Tile()
    .size([size.value.w, size.value.h])
    .scale(t.k)
    // d3-tile's translate is where the *centre* of the world sits, not its
    // top-left corner — the same half-world shift the projection needs.
    .translate([t.x + t.k / 2, t.y + t.k / 2])
    .tileSize(TILE_SIZE)
    .clampX(false)()

  const list = layout.map(([x, y, z]) => {
    const span = 2 ** z
    // clampX(false) lets the world repeat sideways, so x can fall outside
    // [0, span) — wrap it before asking the tile server for it.
    const wrappedX = ((x % span) + span) % span
    return {
      key: `${z}/${x}/${y}`,
      url: `https://${'abcd'[Math.abs(wrappedX + y) % 4]}.basemaps.cartocdn.com/${isDark.value ? 'dark_all' : 'light_all'}/${z}/${wrappedX}/${y}@2x.png`,
      x: (x + layout.translate[0]) * layout.scale,
      y: (y + layout.translate[1]) * layout.scale,
      size: layout.scale
    }
  })
  return { list }
})

// ---------------------------------------------------------------------------
//  Country highlight
//  Only the countries a photo was actually taken in, and only while a country
//  is still a sensible unit on screen — past that the tiles say more.
// ---------------------------------------------------------------------------
type Topology = Parameters<typeof feature>[0]

const { data: world } = useAsyncData('world-atlas-50m', async () => {
  const topology = await $fetch<Topology>('/data/countries-50m.json')
  const collection = feature(topology, topology.objects.countries!) as FeatureCollection<Geometry>
  return collection.features
}, { server: false, default: () => [], lazy: true })

const coveredCountries = computed(() => {
  if (props.compact || !ready.value || !world.value.length || !hasSites.value) return []
  return world.value.filter((country: Feature<Geometry>) =>
    sites.value.some(site => geoContains(country, [site.lng, site.lat]))
  )
})

/** The projection that matches the current transform exactly (see toUnit). */
const projection = computed(() => {
  const t = transform.value
  return geoMercator().scale(t.k / TAU).translate([t.x + t.k / 2, t.y + t.k / 2])
})

const countryPaths = computed(() => {
  const path = geoPath(projection.value)
  return coveredCountries.value.map(country => path(country)).filter(Boolean) as string[]
})

/** Fades out between z7 and z9, once towns matter more than borders. */
const highlightOpacity = computed(() => {
  const z = zoomLevel.value
  if (z <= 7) return 1
  if (z >= 9) return 0
  return (9 - z) / 2
})

// ---------------------------------------------------------------------------
//  Pins
// ---------------------------------------------------------------------------
const points = computed(() => {
  if (!ready.value) return []
  return sites.value.map((site) => {
    const [ux, uy] = toUnit(site.lng, site.lat)
    const [x, y] = transform.value.apply([ux, uy])
    return { site, x, y }
  })
})

const maxPhotos = computed(() => Math.max(1, ...sites.value.map(s => s.photos.length)))
function radiusOf(site: Site) {
  return props.compact ? 7 : 5 + 5 * Math.sqrt(site.photos.length / maxPhotos.value)
}

const activeId = ref<string | null>(null)
const activePoint = computed(() => points.value.find(point => point.site.id === activeId.value) || null)

/** Screen position of the open card, kept inside the panel. */
const cardPosition = computed(() => {
  if (!activePoint.value) return null
  const { x, y } = activePoint.value
  const flipUp = y > size.value.h * 0.55
  return {
    left: `${Math.min(Math.max(x, 130), size.value.w - 130)}px`,
    top: `${flipUp ? y - 18 : y + 18}px`,
    transform: flipUp ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
  }
})

function toggle(id: string) {
  activeId.value = activeId.value === id ? null : id
}
</script>

<template>
  <section
    v-if="hasSites"
    class="not-prose"
  >
    <div
      v-if="!compact"
      class="mb-3 flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        <h2 class="text-lg font-medium text-highlighted">
          {{ heading }}
        </h2>
        <p class="text-sm text-muted">
          {{ totalPinned }} {{ totalPinned === 1 ? 'frame' : 'frames' }} from
          {{ sites.length }} {{ sites.length === 1 ? 'site' : 'sites' }} — pick a pin to see what came
          out of it, scroll to zoom, drag to pan.
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Zoom out"
          @click="zoomBy(1 / 2)"
        />
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Zoom in"
          @click="zoomBy(2)"
        />
        <!-- Always mounted: appearing on the first zoom would shift the
             buttons next to it out from under the cursor. -->
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          size="xs"
          label="Reset"
          :disabled="isHome"
          @click="resetView"
        />
      </div>
    </div>

    <div
      ref="wrapper"
      class="relative overflow-hidden rounded-lg border border-default bg-[#e5e3df] dark:bg-[#0b0e17]"
      :style="{ height: `${size.h}px` }"
    >
      <svg
        ref="svg"
        :width="size.w"
        :height="size.h"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        class="block cursor-grab touch-pan-y active:cursor-grabbing"
        role="img"
        aria-label="Map of the places these photographs were taken"
        @click="activeId = null"
      >
        <defs>
          <radialGradient id="photomap-glow">
            <stop
              offset="0%"
              stop-color="var(--ui-primary)"
              stop-opacity="0.5"
            />
            <stop
              offset="100%"
              stop-color="var(--ui-primary)"
              stop-opacity="0"
            />
          </radialGradient>
        </defs>

        <!-- Basemap -->
        <g>
          <image
            v-for="entry in tiles.list"
            :key="entry.key"
            :href="entry.url"
            :x="entry.x"
            :y="entry.y"
            :width="entry.size"
            :height="entry.size"
          />
        </g>

        <!-- Countries a photo was taken in -->
        <g
          v-if="highlightOpacity > 0"
          :opacity="highlightOpacity"
          class="pointer-events-none"
        >
          <path
            v-for="(d, index) in countryPaths"
            :key="index"
            :d="d"
            fill="var(--ui-primary)"
            fill-opacity="0.14"
            stroke="var(--ui-primary)"
            stroke-opacity="0.7"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Pins -->
        <g>
          <g
            v-for="point in points"
            :key="point.site.id"
            :transform="`translate(${point.x},${point.y})`"
            class="cursor-pointer"
            role="button"
            tabindex="0"
            :aria-label="`${point.site.label}, ${point.site.photos.length} photos`"
            @click.stop="toggle(point.site.id)"
            @keydown.enter.prevent="toggle(point.site.id)"
            @mouseenter="activeId = point.site.id"
          >
            <circle
              :r="radiusOf(point.site) * 3.4"
              fill="url(#photomap-glow)"
            />
            <circle
              :r="radiusOf(point.site)"
              fill="none"
              stroke="var(--ui-primary)"
              stroke-width="1.25"
            >
              <animate
                attributeName="r"
                :values="`${radiusOf(point.site)};${radiusOf(point.site) * 1.8};${radiusOf(point.site)}`"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;0;0.7"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              :r="radiusOf(point.site) * 0.55"
              fill="var(--ui-primary)"
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <text
              v-if="point.site.photos.length > 1"
              :y="-radiusOf(point.site) - 6"
              text-anchor="middle"
              class="fill-white text-[10px] font-medium"
            >
              {{ point.site.photos.length }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Compact maps have no button row, so they get their own controls -->
      <div
        v-if="compact"
        class="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border border-black/10 bg-white/80 backdrop-blur dark:border-white/15 dark:bg-neutral-900/80"
      >
        <button
          type="button"
          class="px-2 py-1 text-black/60 transition hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Zoom in"
          @click="zoomBy(2)"
        >
          <UIcon
            name="i-lucide-plus"
            class="size-3.5"
          />
        </button>
        <button
          type="button"
          class="px-2 py-1 text-black/60 transition hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Zoom out"
          @click="zoomBy(1 / 2)"
        >
          <UIcon
            name="i-lucide-minus"
            class="size-3.5"
          />
        </button>
      </div>

      <!-- Required by the tile licence -->
      <p class="pointer-events-none absolute bottom-0 right-0 bg-white/60 px-1.5 py-0.5 text-[9px] text-black/45 dark:bg-neutral-950/60 dark:text-white/45">
        © OpenStreetMap contributors © CARTO
      </p>

      <!-- Site card -->
      <Transition
        enter-active-class="transition duration-150"
        enter-from-class="opacity-0 translate-y-1"
        leave-active-class="transition duration-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="activePoint && cardPosition"
          class="absolute z-10 w-64 rounded-lg border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-neutral-900/95"
          :style="cardPosition"
          @mouseleave="activeId = null"
        >
          <p class="text-sm font-medium text-black dark:text-white">
            {{ activePoint.site.label }}
          </p>
          <p class="text-[11px] text-black/50 dark:text-white/50">
            {{ activePoint.site.lat.toFixed(3) }}°, {{ activePoint.site.lng.toFixed(3) }}° ·
            {{ activePoint.site.photos.length }} {{ activePoint.site.photos.length === 1 ? 'frame' : 'frames' }}
          </p>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li
              v-for="photo in activePoint.site.photos.slice(0, 4)"
              :key="photo.slug"
            >
              <NuxtLink
                :to="photo.path"
                class="flex items-center gap-2 rounded p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <img
                  :src="photo.thumb"
                  :alt="photo.alt"
                  class="size-10 shrink-0 rounded object-cover"
                  loading="lazy"
                >
                <span class="min-w-0">
                  <span class="block truncate text-xs text-black dark:text-white">{{ photo.title }}</span>
                  <span
                    v-if="photo.date"
                    class="block truncate text-[11px] text-black/50 dark:text-white/50"
                  >{{ photo.date }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
          <p
            v-if="activePoint.site.photos.length > 4"
            class="mt-1 text-[11px] text-black/50 dark:text-white/50"
          >
            +{{ activePoint.site.photos.length - 4 }} more from here
          </p>
        </div>
      </Transition>
    </div>
  </section>
</template>
