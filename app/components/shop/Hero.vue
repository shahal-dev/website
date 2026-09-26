<script setup lang="ts">
import type { Photo } from '~~/app/types/shop'

defineProps<{ photo?: Photo }>()
</script>

<template>
  <section class="relative overflow-hidden rounded-2xl min-h-[540px] flex items-end md:items-center bg-slate-900">
    <img
      v-if="photo"
      :src="photo.medium"
      :alt="photo.alt"
      class="absolute inset-0 w-full h-full object-cover opacity-65"
    >
    <div class="absolute inset-0 bg-gradient-to-r from-[#020420] via-[#020420]/80 to-transparent" />
    <div class="relative z-10 max-w-2xl p-8 md:p-16 text-left">
      <p class="text-emerald-400 text-sm tracking-[0.25em] uppercase mb-4">
        Fine art astrophotography
      </p>
      <h1 class="text-5xl md:text-7xl leading-tight font-bold text-white">
        Bring the night sky <span class="text-emerald-400">home.</span>
      </h1>
      <p class="text-slate-200 mt-6 max-w-lg text-lg">
        Explore images captured under dark skies and choose a fine art print, a framed print, or a one of one copy.
      </p>
      <div class="flex flex-wrap gap-3 mt-8">
        <UButton
          to="/shop/collection/all"
          size="xl"
          color="success"
        >
          Explore the collection
        </UButton>
        <UButton
          to="/shop/about"
          size="xl"
          color="neutral"
          variant="outline"
        >
          How ordering works
        </UButton>
      </div>
    </div>
  </section>
</template>
