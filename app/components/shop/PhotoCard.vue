<script setup lang="ts">
import { money, prices, type Photo } from '~~/app/types/shop'

defineProps<{ photo: Photo, lazy?: boolean }>()
</script>

<template>
  <NuxtLink
    :to="`/shop/product/${photo.slug}`"
    class="group block text-left rounded-lg overflow-hidden border border-slate-800 hover:border-slate-500 transition"
  >
    <div class="aspect-[4/3] overflow-hidden bg-slate-900">
      <img
        :src="photo.thumb"
        :alt="photo.alt"
        :loading="lazy ? 'lazy' : 'eager'"
        class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
      >
    </div>
    <div class="p-4">
      <p
        v-if="photo.tag"
        class="text-emerald-400 uppercase tracking-widest text-xs"
      >{{ photo.tag }}</p>
      <h3 class="text-white font-medium text-lg mt-1">{{ photo.title }}</h3>
      <p class="text-slate-400 text-sm mt-1">Prints from {{ money(prices.print) }}</p>
    </div>
  </NuxtLink>
</template>
