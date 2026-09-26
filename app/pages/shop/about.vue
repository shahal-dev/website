<script setup lang="ts">
import { money, prices, printSize } from '~~/app/types/shop'
import { shopPaymentNumber } from '~~/shared/utils/shop-pricing'

definePageMeta({ layout: 'shop' })
useSeoMeta({ title: 'About the prints', description: 'Print formats, sizing, and how to order astrophotography by Shahal.' })
</script>

<template>
  <div class="max-w-5xl mx-auto px-6">
    <div class="py-16 text-center">
      <p class="text-emerald-400 uppercase tracking-widest text-sm">
        About the shop
      </p>
      <h1 class="text-4xl md:text-5xl font-semibold mt-3">
        A piece of the night sky
      </h1>
      <p class="text-slate-300 max-w-2xl mx-auto mt-5 leading-relaxed">
        These images are captured and processed by Shahal. Every photograph is available as a fine art print or framed print. Selected images are also available as a one of one copy.
      </p>
    </div>
    <div class="grid gap-5 md:grid-cols-3">
      <div class="border border-slate-800 rounded-xl p-7">
        <h2 class="text-xl font-medium">
          Fine art print
        </h2><p class="text-emerald-400 text-2xl mt-4">
          {{ money(prices.print) }}
        </p><p class="text-slate-400 mt-4">
          An unframed print, ready for the display you choose.
        </p>
      </div>
      <div class="border border-slate-800 rounded-xl p-7">
        <h2 class="text-xl font-medium">
          Framed print
        </h2><p class="text-emerald-400 text-2xl mt-4">
          {{ money(prices.framed) }}
        </p><p class="text-slate-400 mt-4">
          The image presented in a frame, ready to hang.
        </p>
      </div>
      <div class="border border-slate-800 rounded-xl p-7">
        <h2 class="text-xl font-medium">
          One of one copy
        </h2><p class="text-emerald-400 text-2xl mt-4">
          {{ money(prices.one_of_one) }}
        </p><p class="text-slate-400 mt-4">
          A unique copy of an image, subject to availability when your order is confirmed.
        </p>
      </div>
    </div>
    <section class="border-t border-slate-800 mt-16 pt-12 max-w-3xl mx-auto">
      <h2 class="text-2xl font-medium">
        Sizing and delivery
      </h2>
      <p class="text-slate-400 mt-4 leading-relaxed">
        The longer side is 24 inches; the shorter side varies with the image crop. The size description for each order is {{ printSize }}. Shipping is arranged separately based on your destination.
      </p>
      <h2 class="text-2xl font-medium mt-10">
        How payment works
      </h2>
      <p class="text-slate-400 mt-4 leading-relaxed">
        At checkout, send the item subtotal to <strong class="text-white">{{ shopPaymentNumber }}</strong> and enter the transaction ID with your contact and delivery details. Shahal will verify the payment and contact you about shipping.
      </p>
      <UButton
        to="/shop/collection/all"
        size="xl"
        color="success"
        class="mt-8"
      >
        Explore images
      </UButton>
    </section>
  </div>
</template>
