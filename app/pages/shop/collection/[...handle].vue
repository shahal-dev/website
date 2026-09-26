<script setup lang="ts">
definePageMeta({ layout: 'shop' })
const route = useRoute()
const handle = computed(() => String(route.params.handle?.[0] || 'all'))
const { data: photos, error } = await useShopPhotos()
const filtered = computed(() => handle.value === 'all' ? photos.value : photos.value.filter(photo => photo.tag?.toLowerCase().replace(/\s+/g, '-') === handle.value))
const tags = computed(() => [...new Set(photos.value.map(photo => photo.tag).filter((tag): tag is string => Boolean(tag)))])
const title = computed(() => handle.value === 'all' ? 'All images' : tags.value.find(tag => tag.toLowerCase().replace(/\s+/g, '-') === handle.value) || 'Images')
useSeoMeta({ title, description: 'Explore astrophotography prints and one of one images by Shahal.' })
</script>

<template>
  <div class="max-w-7xl mx-auto px-6">
    <div class="py-14 text-left">
      <p class="text-emerald-400 text-sm uppercase tracking-widest">
        Explore
      </p>
      <h1 class="text-4xl md:text-5xl font-semibold mt-3">
        {{ title }}
      </h1>
      <p class="text-slate-400 mt-3">
        Astrophotography images available as prints and framed prints.
      </p>
    </div>
    <div class="flex flex-wrap gap-2 mb-8">
      <NuxtLink
        to="/shop/collection/all"
        class="rounded-full px-4 py-2 text-sm border"
        :class="handle === 'all' ? 'border-emerald-400 text-emerald-400' : 'border-slate-700 text-slate-300 hover:border-slate-400'"
      >All images</NuxtLink>
      <NuxtLink
        v-for="tag in tags"
        :key="tag"
        :to="`/shop/collection/${tag.toLowerCase().replace(/\s+/g, '-')}`"
        class="rounded-full px-4 py-2 text-sm border"
        :class="handle === tag.toLowerCase().replace(/\s+/g, '-') ? 'border-emerald-400 text-emerald-400' : 'border-slate-700 text-slate-300 hover:border-slate-400'"
      >{{ tag }}</NuxtLink>
    </div>
    <p
      v-if="error"
      role="alert"
      class="text-red-400"
    >
      Images could not be loaded. Please try again shortly.
    </p>
    <div
      v-else-if="filtered.length"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <ShopPhotoCard
        v-for="(photo, index) in filtered"
        :key="photo.slug"
        :photo="photo"
        :lazy="index > 3"
      />
    </div>
    <div
      v-else
      class="rounded-xl border border-dashed border-slate-700 px-6 py-16 text-center text-slate-400"
    >
      No images in this collection yet.
    </div>
  </div>
</template>
