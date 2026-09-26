<script setup lang="ts">
import { formatLabel, money, prices } from '~~/app/types/shop'

const { lines, subtotal, isCartOpen, update, remove } = usePrintCart()
const { data: photos } = await useShopPhotos()
const bySlug = computed(() => new Map(photos.value.map(photo => [photo.slug, photo])))
</script>

<template>
  <div class="flex h-full flex-col text-left">
    <p
      v-if="!lines.length"
      class="text-slate-400 py-12 text-center"
    >
      Your order is empty. Explore the gallery to choose an image.
    </p>
    <ul
      v-else
      class="flex-1 overflow-auto divide-y divide-slate-800"
    >
      <li
        v-for="item in lines"
        :key="`${item.slug}-${item.format}`"
        class="flex gap-4 py-5"
      >
        <img
          v-if="bySlug.get(item.slug)"
          :src="bySlug.get(item.slug)?.thumb"
          :alt="bySlug.get(item.slug)?.alt"
          class="size-20 rounded-md object-cover"
        >
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">
            {{ bySlug.get(item.slug)?.title || item.slug }}
          </p>
          <p class="text-slate-400 text-sm mt-1">
            {{ formatLabel(item.format) }}
          </p>
          <div class="flex items-center gap-3 mt-2">
            <label class="text-xs text-slate-400">Qty <input
              :value="item.quantity"
              type="number"
              min="1"
              :max="item.format === 'one_of_one' ? 1 : 20"
              :disabled="item.format === 'one_of_one'"
              class="w-14 ml-1 rounded border border-slate-700 bg-[#020420] p-1 text-white"
              @change="update(item.slug, item.format, Number(($event.target as HTMLInputElement).value))"
            ></label>
            <button
              type="button"
              class="text-xs text-slate-400 underline hover:text-white"
              @click="remove(item.slug, item.format)"
            >
              Remove
            </button>
          </div>
        </div>
        <p class="text-sm shrink-0">
          {{ money(prices[item.format] * item.quantity) }}
        </p>
      </li>
    </ul>
    <div
      v-if="lines.length"
      class="border-t border-slate-800 pt-5 mt-5"
    >
      <div class="flex justify-between font-semibold">
        <span>Item subtotal</span><span>{{ money(subtotal) }}</span>
      </div>
      <p class="text-xs text-slate-400 mt-2">
        Payment instructions are provided at checkout. Shipping is arranged separately.
      </p>
      <UButton
        to="/shop/checkout"
        block
        size="xl"
        color="success"
        class="mt-5"
        @click="isCartOpen = false"
      >
        Continue to checkout
      </UButton>
    </div>
  </div>
</template>
