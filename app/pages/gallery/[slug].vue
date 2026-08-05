<script setup lang="ts">
interface Frame { medium: string, full: string, caption?: string }

interface GalleryDetail {
  slug: string
  path: string
  title: string
  description: string
  object?: string
  tag?: string
  alt: string
  thumb: string
  medium: string
  full: string
  frames: Frame[]
  reference?: { src: string, label?: string, credit: string, url?: string } | null
  gear?: Record<string, string>
  acquisition?: Record<string, string>
  date?: string
  location?: string
  lat?: number | null
  lng?: number | null
  /** Markdown, written in the admin. */
  body?: string
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const photo = await useContentItem<GalleryDetail>(`gallery-${slug.value}`, `gallery/${slug.value}`)
if (!photo.value) {
  throw createError({ statusCode: 404, statusMessage: 'Photo not found', fatal: true })
}

const all = await useContentItems<GalleryDetail>('gallery-photos', 'gallery')
const neighbours = computed(() => {
  const index = all.value.findIndex(item => item.slug === slug.value)
  return { previous: all.value[index - 1] || null, next: all.value[index + 1] || null }
})

const frames = computed(() => {
  if (!photo.value) return []
  return [
    { medium: photo.value.medium, full: photo.value.full, caption: photo.value.description },
    ...(photo.value.frames || [])
  ]
})

const facts = computed(() => {
  const gear = photo.value?.gear || {}
  const acquisition = photo.value?.acquisition || {}
  return [
    { label: 'Object', value: photo.value?.object },
    { label: 'Date', value: photo.value?.date },
    { label: 'Location', value: photo.value?.location },
    { label: 'Telescope / lens', value: gear.telescope },
    { label: 'Camera', value: gear.camera },
    { label: 'Mount', value: gear.mount },
    { label: 'Filters', value: gear.filters },
    { label: 'Exposures', value: acquisition.exposures },
    { label: 'Integration', value: acquisition.integration },
    { label: 'Sky', value: acquisition.sky }
  ].filter(fact => fact.value)
})

/** The map component takes a list; here that list is one photo. */
const mapPhotos = computed(() => {
  if (!photo.value || photo.value.lat === null || photo.value.lat === undefined) return []
  return [{
    slug: photo.value.slug,
    path: photo.value.path,
    title: photo.value.title,
    thumb: photo.value.thumb,
    alt: photo.value.alt,
    date: photo.value.date,
    location: photo.value.location,
    lat: photo.value.lat,
    lng: photo.value.lng
  }]
})

const url = useSiteUrl()

useJsonLd(() => ({
  '@type': 'ImageObject',
  'name': photo.value?.title,
  'description': photo.value?.description,
  'contentUrl': photo.value?.full,
  'thumbnailUrl': photo.value?.thumb,
  'url': url(`/gallery/${slug.value}`),
  'creator': { '@type': 'Person', 'name': 'MD Shahadat Hossain Shahal' },
  'copyrightHolder': { '@type': 'Person', 'name': 'MD Shahadat Hossain Shahal' },
  ...(photo.value?.date ? { dateCreated: photo.value.date } : {}),
  ...(photo.value?.location
    ? {
        contentLocation: {
          '@type': 'Place',
          'name': photo.value.location,
          ...(photo.value.lat !== null && photo.value.lat !== undefined
            ? { geo: { '@type': 'GeoCoordinates', 'latitude': photo.value.lat, 'longitude': photo.value.lng } }
            : {})
        }
      }
    : {}),
  ...(photo.value?.gear?.camera ? { exifData: photo.value.gear.camera } : {})
}))

useJsonLd(() => ({
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Gallery', 'item': url('/gallery') },
    { '@type': 'ListItem', 'position': 2, 'name': photo.value?.title, 'item': url(`/gallery/${slug.value}`) }
  ]
}))

useSeoMeta({
  title: photo.value?.title,
  ogTitle: photo.value?.title,
  description: photo.value?.description,
  ogDescription: photo.value?.description,
  ogImage: photo.value?.medium,
  ogType: 'article'
})
</script>

<template>
  <UPage v-if="photo">
    <UPageHeader
      :title="photo.title"
      :description="photo.description"
      :ui="{ title: 'text-3xl sm:text-4xl' }"
    >
      <template #headline>
        <div class="flex items-center gap-2 text-sm text-muted">
          <ULink
            to="/gallery"
            class="hover:text-default"
          >
            Gallery
          </ULink>
          <span v-if="photo.tag">/</span>
          <span v-if="photo.tag">{{ photo.tag }}</span>
        </div>
      </template>
    </UPageHeader>

    <UPageBody>
      <UCarousel
        v-slot="{ item }"
        :items="frames"
        arrows
        :dots="frames.length > 1"
        class="w-full"
        :ui="{ item: 'basis-full' }"
      >
        <figure>
          <a
            :href="item.full"
            target="_blank"
            rel="noopener"
            class="block overflow-hidden rounded-lg border border-default"
          >
            <img
              :src="item.medium"
              :alt="photo.alt"
              class="w-full"
            >
          </a>
          <figcaption
            v-if="item.caption"
            class="mt-2 text-xs text-dimmed"
          >
            {{ item.caption }}
          </figcaption>
        </figure>
      </UCarousel>

      <p class="mt-2 text-xs text-dimmed">
        Click a frame to open the full-resolution version.
      </p>

      <div
        v-if="facts.length"
        class="my-8 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-default bg-elevated/40 p-5 sm:grid-cols-3"
      >
        <div
          v-for="fact in facts"
          :key="fact.label"
        >
          <dt class="text-xs tracking-wide text-dimmed uppercase">
            {{ fact.label }}
          </dt>
          <dd class="text-sm text-default">
            {{ fact.value }}
          </dd>
        </div>
      </div>

      <ClientOnly>
        <section
          v-if="mapPhotos.length"
          class="my-8"
        >
          <h2 class="mb-2 text-sm tracking-wide text-dimmed uppercase">
            Shot from
          </h2>
          <PhotoMap
            :photos="mapPhotos"
            compact
          />
        </section>
      </ClientOnly>

      <MDC
        v-if="photo.body"
        :value="photo.body"
        class="prose prose-sm dark:prose-invert max-w-none"
      />

      <section
        v-if="photo.reference?.src"
        class="mt-10"
      >
        <h2 class="text-lg font-medium text-highlighted">
          Compared with {{ photo.reference.label || 'a professional telescope' }}
        </h2>
        <p class="mt-1 mb-4 text-sm text-muted">
          Drag the handle to wipe between my frame and the reference image.
        </p>
        <ImageCompare
          :before="photo.medium"
          :after="photo.reference.src"
          :before-alt="photo.alt"
          :after-alt="photo.reference.label || 'Reference image'"
          before-label="My frame"
          :after-label="photo.reference.label || 'Reference'"
        >
          <template #caption>
            {{ photo.reference.credit }}
            <ULink
              v-if="photo.reference.url"
              :to="photo.reference.url"
              target="_blank"
              class="text-primary"
            >
              Source
            </ULink>
          </template>
        </ImageCompare>
      </section>

      <div class="mt-12 flex items-center justify-between gap-4 border-t border-default pt-6">
        <ULink
          v-if="neighbours.previous"
          :to="neighbours.previous.path"
          class="flex items-center gap-2 text-sm text-muted hover:text-default"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          {{ neighbours.previous.title }}
        </ULink>
        <span v-else />
        <ULink
          v-if="neighbours.next"
          :to="neighbours.next.path"
          class="flex items-center gap-2 text-right text-sm text-muted hover:text-default"
        >
          {{ neighbours.next.title }}
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </ULink>
      </div>
    </UPageBody>
  </UPage>
</template>
