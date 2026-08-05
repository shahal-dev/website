<script setup lang="ts">
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo'
import { select } from 'd3-selection'
// Side-effect import: this is what puts .transition() on a d3 selection.
import 'd3-transition'
import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

/**
 * "Where I stood" — the shooting sites behind the gallery, on a D3 map.
 *
 * Photos without coordinates are simply absent; photos shot from the same spot
 * collapse into one pin sized by how many frames came out of it. The map fits
 * itself to the sites on load, so it works the same with three pins in one
 * district as it would with thirty across the world.
 */

interface MapPhoto {
  slug: string
  path: string
  title: string
  tag?: string
  thumb: string
  alt: string
  date?: string
  location?: string
  lat?: number | null
  lng?: number | null
}

const props = defineProps<{ photos: MapPhoto[] }>()

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
    byKey.set(key, {
      id: key,
      label: photo.location || 'Unnamed site',
      lat,
      lng,
      photos: [photo]
    })
  }
  // Busiest sites first so their pins land on top of quieter ones.
  return [...byKey.values()].sort((a, b) => b.photos.length - a.photos.length)
})

const hasSites = computed(() => sites.value.length > 0)

// ---------------------------------------------------------------------------
//  Canvas size
// ---------------------------------------------------------------------------
const wrapper = ref<HTMLElement | null>(null)
const { width } = useElementSize(wrapper)
const height = computed(() => Math.round(Math.min(560, Math.max(320, (width.value || 800) * 0.58))))
const size = computed(() => ({ w: Math.max(320, width.value || 800), h: height.value }))

// ---------------------------------------------------------------------------
//  World geometry (fetched once, cached across navigations)
// ---------------------------------------------------------------------------
type Topology = Parameters<typeof feature>[0]

// 50m rather than 110m: the sites sit inside one country, and the coarse
// version has no usable coastline at that zoom.
const { data: world } = useAsyncData('world-atlas-50m', async () => {
  const topology = await $fetch<Topology>('/data/countries-50m.json')
  const collection = feature(topology, topology.objects.countries!) as FeatureCollection<Geometry>
  return collection.features
}, { server: false, default: () => [], lazy: true })

// ---------------------------------------------------------------------------
//  Projection — fitted to the sites, with a floor and a ceiling on the zoom so
//  a single pin doesn't drop us onto a rooftop and a lone pair doesn't leave
//  the map without any recognisable coastline.
// ---------------------------------------------------------------------------
const MIN_SCALE = 90
const MAX_SCALE = 2600

const projection = computed(() => {
  const { w, h } = size.value
  const proj = geoMercator().translate([w / 2, h / 2]).scale(MIN_SCALE)
  if (!hasSites.value) return proj

  proj.fitExtent([[w * 0.12, h * 0.16], [w * 0.88, h * 0.84]], {
    type: 'FeatureCollection',
    features: sites.value.map(site => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Point' as const, coordinates: [site.lng, site.lat] }
    }))
  })

  const fitted = proj.scale()
  if (fitted < MIN_SCALE || fitted > MAX_SCALE) {
    // Re-centre by hand: fitExtent's translate is only right at its own scale.
    const centre: [number, number] = [
      sites.value.reduce((sum, s) => sum + s.lng, 0) / sites.value.length,
      sites.value.reduce((sum, s) => sum + s.lat, 0) / sites.value.length
    ]
    proj.scale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitted)))
      .translate([w / 2, h / 2])
      .center(centre)
  }
  return proj
})

const pathOf = computed(() => geoPath(projection.value))
const countryPaths = computed(() =>
  world.value.map((country: Feature<Geometry>) => pathOf.value(country)).filter(Boolean) as string[]
)
const graticulePath = computed(() => pathOf.value(geoGraticule10()) || '')
const spherePath = computed(() => pathOf.value({ type: 'Sphere' }) || '')

// ---------------------------------------------------------------------------
//  Pan & zoom
// ---------------------------------------------------------------------------
const svg = ref<SVGSVGElement | null>(null)
const transform = ref(zoomIdentity)
const zoomBehaviour = d3Zoom<SVGSVGElement, unknown>()
  .scaleExtent([1, 18])
  // The map sits in the middle of a scrolling page, so a bare wheel has to
  // stay page scroll. Zoom is the buttons, a pinch, or ctrl/⌘ + wheel.
  .filter((event: Event) => {
    if (event.type === 'wheel') return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
    return !(event as MouseEvent).button
  })
  .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
    transform.value = event.transform
  })

const transformAttr = computed(() => {
  const t = transform.value
  return `translate(${t.x},${t.y}) scale(${t.k})`
})

/** Pins keep their pixel size while the map underneath grows. */
const pinScale = computed(() => 1 / transform.value.k)
// Loose comparison: a click d3 reads as a one-pixel drag shouldn't light up
// a "Reset" button for a view that hasn't visibly moved.
const isZoomed = computed(() => {
  const t = transform.value
  return Math.abs(t.k - 1) > 0.01 || Math.abs(t.x) > 2 || Math.abs(t.y) > 2
})

onMounted(() => {
  if (svg.value) select(svg.value).call(zoomBehaviour)
})

// Keep the map from being dragged off its own canvas.
watchEffect(() => {
  zoomBehaviour.translateExtent([[0, 0], [size.value.w, size.value.h]])
})

function resetView() {
  if (svg.value) select(svg.value).transition().duration(600).call(zoomBehaviour.transform, zoomIdentity)
}

function zoomBy(factor: number) {
  if (svg.value) select(svg.value).transition().duration(300).call(zoomBehaviour.scaleBy, factor)
}

// ---------------------------------------------------------------------------
//  Pins & the card that hangs off them
// ---------------------------------------------------------------------------
const points = computed(() => sites.value.map((site) => {
  const xy = projection.value([site.lng, site.lat])
  return { site, x: xy?.[0] ?? 0, y: xy?.[1] ?? 0, visible: Boolean(xy) }
}).filter(point => point.visible))

const maxPhotos = computed(() => Math.max(1, ...sites.value.map(s => s.photos.length)))
function radiusOf(site: Site) {
  return 5 + 5 * Math.sqrt(site.photos.length / maxPhotos.value)
}

const activeId = ref<string | null>(null)
const activePoint = computed(() => points.value.find(point => point.site.id === activeId.value) || null)

/** Screen position of the open card, so it can ride along with pan and zoom. */
const cardPosition = computed(() => {
  if (!activePoint.value) return null
  const t = transform.value
  const x = activePoint.value.x * t.k + t.x
  const y = activePoint.value.y * t.k + t.y
  const flipUp = y > size.value.h * 0.55
  const clampedX = Math.min(Math.max(x, 130), size.value.w - 130)
  return {
    left: `${clampedX}px`,
    top: `${flipUp ? y - 18 : y + 18}px`,
    transform: flipUp ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
  }
})

function toggle(id: string) {
  activeId.value = activeId.value === id ? null : id
}

const totalPinned = computed(() => sites.value.reduce((sum, site) => sum + site.photos.length, 0))

// A fixed sprinkle of stars — same every render, so SSR and the client agree.
const stars = Array.from({ length: 70 }, (_, index) => {
  const a = Math.sin(index * 12.9898) * 43758.5453
  const b = Math.sin(index * 78.233) * 12345.6789
  return {
    x: (a - Math.floor(a)) * 100,
    y: (b - Math.floor(b)) * 100,
    r: 0.4 + (a - Math.floor(a)) * 1.1,
    o: 0.25 + (b - Math.floor(b)) * 0.5
  }
})
</script>

<template>
  <section
    v-if="hasSites"
    class="not-prose"
  >
    <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-lg font-medium text-highlighted">
          Where I stood
        </h2>
        <p class="text-sm text-muted">
          {{ totalPinned }} {{ totalPinned === 1 ? 'frame' : 'frames' }} from
          {{ sites.length }} {{ sites.length === 1 ? 'site' : 'sites' }} — pick a pin to see what came out of it, drag to pan.
        </p>
      </div>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Zoom out"
          @click="zoomBy(1 / 1.6)"
        />
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Zoom in"
          @click="zoomBy(1.6)"
        />
        <!-- Always mounted: appearing on the first zoom would shift the
             buttons next to it out from under the cursor. -->
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          size="xs"
          label="Reset"
          :disabled="!isZoomed"
          @click="resetView"
        />
      </div>
    </div>

    <div
      ref="wrapper"
      class="relative overflow-hidden rounded-lg border border-default bg-neutral-950"
      :style="{ height: `${size.h}px` }"
      @click.self="activeId = null"
    >
      <svg
        ref="svg"
        :width="size.w"
        :height="size.h"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        class="block cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label="Map of the places these photographs were taken"
        @click="activeId = null"
      >
        <defs>
          <radialGradient id="photomap-glow">
            <stop
              offset="0%"
              stop-color="var(--ui-primary)"
              stop-opacity="0.55"
            />
            <stop
              offset="100%"
              stop-color="var(--ui-primary)"
              stop-opacity="0"
            />
          </radialGradient>
        </defs>

        <!-- Sky -->
        <rect
          :width="size.w"
          :height="size.h"
          fill="#07080d"
        />
        <g>
          <circle
            v-for="(star, index) in stars"
            :key="index"
            :cx="`${star.x}%`"
            :cy="`${star.y}%`"
            :r="star.r"
            fill="#fff"
            :opacity="star.o"
          />
        </g>

        <!-- Earth -->
        <g :transform="transformAttr">
          <path
            :d="spherePath"
            fill="#060c1a"
            stroke="none"
          />
          <path
            :d="graticulePath"
            fill="none"
            stroke="#ffffff"
            stroke-opacity="0.05"
            stroke-width="0.6"
            vector-effect="non-scaling-stroke"
          />
          <path
            v-for="(d, index) in countryPaths"
            :key="index"
            :d="d"
            fill="#1c2740"
            stroke="#4b5f8a"
            stroke-width="0.7"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Pins -->
        <g :transform="transformAttr">
          <g
            v-for="point in points"
            :key="point.site.id"
            :transform="`translate(${point.x},${point.y}) scale(${pinScale})`"
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
              :opacity="activeId === point.site.id ? 1 : 0.7"
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

      <!-- Site card -->
      <Transition
        enter-active-class="transition duration-150"
        enter-from-class="opacity-0 translate-y-1"
        leave-active-class="transition duration-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="activePoint && cardPosition"
          class="absolute z-10 w-64 rounded-lg border border-white/10 bg-neutral-900/95 p-3 shadow-xl backdrop-blur"
          :style="cardPosition"
          @mouseleave="activeId = null"
        >
          <p class="text-sm font-medium text-white">
            {{ activePoint.site.label }}
          </p>
          <p class="text-[11px] text-white/50">
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
                class="flex items-center gap-2 rounded p-1 transition hover:bg-white/10"
              >
                <img
                  :src="photo.thumb"
                  :alt="photo.alt"
                  class="size-10 shrink-0 rounded object-cover"
                  loading="lazy"
                >
                <span class="min-w-0">
                  <span class="block truncate text-xs text-white">{{ photo.title }}</span>
                  <span
                    v-if="photo.date"
                    class="block truncate text-[11px] text-white/50"
                  >{{ photo.date }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
          <p
            v-if="activePoint.site.photos.length > 4"
            class="mt-1 text-[11px] text-white/50"
          >
            +{{ activePoint.site.photos.length - 4 }} more from here
          </p>
        </div>
      </Transition>
    </div>
  </section>
</template>
