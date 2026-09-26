<script setup lang="ts">
definePageMeta({ layout: 'shop' })
const { data: photos, error } = await useShopPhotos()
const featured = computed(() => photos.value.slice(0, 6))
useSeoMeta({ title: 'The image shop', description: 'Fine art astrophotography prints, framed prints, and one of one copies by Shahal.' })
</script>

<template>
  <div class="max-w-7xl mx-auto px-6">
    <ShopHero
      :photo="photos[0]"
      class="mt-8"
    />
    <section class="mt-20">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div class="text-left">
          <p class="text-emerald-400 text-sm uppercase tracking-widest">
            The collection
          </p>
          <h2 class="text-3xl md:text-4xl font-semibold text-white mt-2">
            Images from the night sky
          </h2>
          <p class="text-slate-400 mt-2">
            Choose the image and finish that suits your space.
          </p>
        </div>
        <UButton
          to="/shop/collection/all"
          color="neutral"
          variant="outline"
        >
          View all images
        </UButton>
      </div>
      <p
        v-if="error"
        role="alert"
        class="text-red-400"
      >
        Images could not be loaded. Please try again shortly.
      </p>
      <div
        v-else-if="featured.length"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ShopPhotoCard
          v-for="(photo, index) in featured"
          :key="photo.slug"
          :photo="photo"
          :lazy="index > 2"
        />
      </div>
      <div
        v-else
        class="rounded-xl border border-dashed border-slate-700 px-6 py-16 text-center text-slate-400"
      >
        Images are coming soon.
      </div>
    </section>
    <section class="mt-24 grid gap-8 md:grid-cols-3 border-t border-slate-800 pt-12 text-left">
      <div>
        <span class="text-emerald-400 text-sm">01</span><h3 class="text-xl font-medium mt-3">
          Pick an image
        </h3><p class="text-slate-400 mt-2">
          Browse the collection and read the story behind each photograph.
        </p>
      </div>
      <div>
        <span class="text-emerald-400 text-sm">02</span><h3 class="text-xl font-medium mt-3">
          Choose a finish
        </h3><p class="text-slate-400 mt-2">
          Select a fine art print, a framed print, or an available one of one copy.
        </p>
      </div>
      <div>
        <span class="text-emerald-400 text-sm">03</span><h3 class="text-xl font-medium mt-3">
          Arrange delivery
        </h3><p class="text-slate-400 mt-2">
          Send payment, enter the transaction ID, and submit your delivery details.
        </p>
      </div>
    </section>
  </div>
</template>
