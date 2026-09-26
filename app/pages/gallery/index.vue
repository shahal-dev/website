<script setup lang="ts">
interface GalleryItem {
  slug: string
  path: string
  title: string
  description: string
  tag?: string
  alt: string
  thumb: string
  medium: string
  date?: string
  location?: string
  lat?: number | null
  lng?: number | null
}

// Heading and blurb come from the `pages` table (admin → Pages → Gallery intro).
const copy = await usePageCopy('gallery', {
  title: 'Chasing Photons',
  description: 'Nights under the sky over Bangladesh — deep-sky objects, the Milky Way, and the Moon. Every frame here was shot, stacked and processed by me.'
})

const photos = await useContentItems<GalleryItem>('gallery-photos', 'gallery')

const slides = computed(() => photos.value.map(photo => ({
  src: photo.medium,
  alt: photo.alt,
  title: photo.title,
  tag: photo.tag,
  caption: photo.description,
  to: photo.path,
  shopTo: imageShopHref(photo.slug)
})))

useSeoMeta({
  title: copy.value.title,
  ogTitle: copy.value.title,
  description: copy.value.description,
  ogDescription: copy.value.description
})

defineOgImage('Portfolio', { title: copy.value.title, description: copy.value.description })

const url = useSiteUrl()

useJsonLd(() => ({
  '@type': 'CollectionPage',
  'name': copy.value.title,
  'description': copy.value.description,
  'url': url('/gallery'),
  'hasPart': photos.value.map(photo => ({
    '@type': 'ImageObject',
    'name': photo.title,
    'url': url(photo.path),
    'thumbnailUrl': photo.thumb
  }))
}))
</script>

<template>
  <UPage>
    <UPageHero
      :title="copy.title"
      :description="copy.description"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left'
      }"
    />
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <template v-if="photos.length">
        <GallerySlider :photos="slides" />

        <ClientOnly>
          <PhotoMap
            :photos="photos"
            class="mt-12"
          />
        </ClientOnly>

        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="photo in photos"
            :key="photo.path"
            class="overflow-hidden rounded-lg border border-default"
          >
            <NuxtLink
              :to="photo.path"
              class="group block overflow-hidden"
              :aria-label="`View ${photo.title}`"
            >
              <img
                :src="photo.thumb"
                :alt="photo.alt"
                class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              >
            </NuxtLink>
            <div class="flex flex-wrap items-center justify-between gap-3 p-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ photo.title }}
                </p>
                <p
                  v-if="photo.tag"
                  class="text-xs text-muted"
                >
                  {{ photo.tag }}
                </p>
              </div>
              <UButton
                :to="imageShopHref(photo.slug)"
                size="sm"
                icon="i-lucide-shopping-bag"
                label="Order print"
              />
            </div>
          </article>
        </div>
      </template>

      <div
        v-else
        class="rounded-lg border border-dashed border-default px-6 py-16 text-center"
      >
        <UIcon
          name="i-lucide-telescope"
          class="size-8 text-dimmed"
        />
        <p class="mt-3 text-sm text-muted">
          No photos published yet.
        </p>
      </div>
    </UPageSection>
  </UPage>
</template>
