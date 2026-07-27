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
}

const { data: filePage } = await useAsyncData('gallery-page', () => {
  return queryCollection('galleryIndex').first()
})

const copy = await usePageCopy('gallery', {
  title: filePage.value?.title,
  description: filePage.value?.description
})

const photos = await useContentItems<GalleryItem>('gallery-photos', 'gallery')

const slides = computed(() => photos.value.map(photo => ({
  src: photo.medium,
  alt: photo.alt,
  title: photo.title,
  tag: photo.tag,
  caption: photo.description,
  to: photo.path
})))

useSeoMeta({
  title: copy.value.title,
  ogTitle: copy.value.title,
  description: copy.value.description,
  ogDescription: copy.value.description
})

defineOgImage('Portfolio', { title: copy.value.title, description: copy.value.description })
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
      <GallerySlider
        v-if="slides.length"
        :photos="slides"
      />

      <div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <NuxtLink
          v-for="photo in photos"
          :key="photo.path"
          :to="photo.path"
          class="group relative block overflow-hidden rounded-lg"
        >
          <img
            :src="photo.thumb"
            :alt="photo.alt"
            class="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
            loading="lazy"
          >
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/85 to-transparent p-3">
            <p class="text-sm font-medium text-white">
              {{ photo.title }}
            </p>
            <p
              v-if="photo.tag"
              class="text-xs text-white/70"
            >
              {{ photo.tag }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </UPageSection>
  </UPage>
</template>
