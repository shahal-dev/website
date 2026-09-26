<script setup lang="ts">
import { formats, money, prices, printSize, type PrintFormat } from '~~/app/types/shop'

definePageMeta({ layout: 'shop' })

const route = useRoute()
const slug = String(route.params.handle?.[0] || '')
const { data: photos } = await useShopPhotos()
const photo = computed(() => photos.value.find(item => item.slug === slug))
if (!photo.value) throw createError({ statusCode: 404, statusMessage: 'Image not found' })
const selected = ref<PrintFormat>('print')
const quantity = ref(1)
const { add } = usePrintCart()
const availableFormats = computed(() => formats.filter(item => item.value !== 'one_of_one' || photo.value?.oneOfOneAvailable))
const related = computed(() => photos.value.filter(item => item.slug !== slug).slice(0, 4))
function selectFormat(value: PrintFormat) {
  selected.value = value
  if (value === 'one_of_one') quantity.value = 1
}
useSeoMeta({ title: photo.value.title, description: photo.value.description, ogImage: photo.value.medium })
useHead({ script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Product', 'name': photo.value.title,
  'description': photo.value.description, 'image': photo.value.medium,
  'offers': availableFormats.value.map(item => ({ '@type': 'Offer', 'price': prices[item.value], 'priceCurrency': 'BDT', 'availability': 'https://schema.org/InStock' }))
}) }] })
</script>

<template>
  <div
    v-if="photo"
    class="max-w-7xl mx-auto px-6"
  >
    <NuxtLink
      to="/shop/collection/all"
      class="inline-block text-slate-400 hover:text-white text-sm mt-8 mb-8"
    >← Back to images</NuxtLink>
    <div class="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div class="rounded-xl overflow-hidden bg-slate-900 self-start">
        <img
          :src="photo.medium"
          :alt="photo.alt"
          class="w-full h-auto object-contain"
        >
      </div>
      <div class="text-left">
        <p
          v-if="photo.tag"
          class="text-emerald-400 uppercase tracking-widest text-sm"
        >
          {{ photo.tag }}
        </p>
        <h1 class="text-4xl md:text-5xl font-semibold mt-3">
          {{ photo.title }}
        </h1>
        <p class="text-slate-300 leading-relaxed mt-6">
          {{ photo.description }}
        </p>
        <div class="border-t border-slate-800 mt-10 pt-8">
          <h2 class="text-lg font-medium mb-4">
            Choose your print
          </h2>
          <div class="space-y-3">
            <button
              v-for="item in availableFormats"
              :key="item.value"
              type="button"
              class="w-full rounded-lg border p-4 flex justify-between items-center text-left transition"
              :class="selected === item.value ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-700 hover:border-slate-500'"
              @click="selectFormat(item.value)"
            >
              <span>{{ item.label }}</span><span>{{ money(prices[item.value]) }}</span>
            </button>
          </div>
          <p class="text-sm text-slate-400 mt-4">
            {{ printSize }}. The shorter side follows the image crop.
          </p>
          <div class="flex gap-4 items-center mt-7">
            <label class="text-sm text-slate-300">Quantity <input
              v-model.number="quantity"
              type="number"
              min="1"
              :max="selected === 'one_of_one' ? 1 : 20"
              :disabled="selected === 'one_of_one'"
              class="ml-2 w-16 rounded border border-slate-700 bg-[#020420] p-2 text-white"
            ></label>
            <UButton
              size="xl"
              color="success"
              class="flex-1"
              @click="add(photo, selected, Math.max(1, Math.min(selected === 'one_of_one' ? 1 : 20, Number(quantity) || 1)))"
            >
              Add to order · {{ money(prices[selected] * (Number(quantity) || 1)) }}
            </UButton>
          </div>
          <p class="text-xs text-slate-400 mt-4">
            Payment instructions and a transaction-ID field are provided at checkout. Shipping is arranged separately. One of one availability is confirmed with your order.
          </p>
        </div>
      </div>
    </div>
    <section
      v-if="related.length"
      class="mt-24"
    >
      <h2 class="text-3xl font-semibold mb-8">
        More to explore
      </h2>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ShopPhotoCard
          v-for="item in related"
          :key="item.slug"
          :photo="item"
          lazy
        />
      </div>
    </section>
  </div>
</template>
