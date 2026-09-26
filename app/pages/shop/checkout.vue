<script setup lang="ts">
import { formatLabel, money, prices, printSize } from '~~/app/types/shop'
import { shopPaymentNumber } from '~~/shared/utils/shop-pricing'

definePageMeta({ layout: 'shop' })

const { lines, subtotal, clear, hydrate } = usePrintCart()
const { data: photos } = await useShopPhotos()
const bySlug = computed(() => new Map(photos.value.map(photo => [photo.slug, photo])))
const customer = reactive({ name: '', email: '', phone: '', country: '', address: '', notes: '', transactionId: '', website: '' })
const pending = ref(false)
const error = ref('')
const reference = ref('')
const placedSubtotal = ref(0)
const invalidLines = computed(() => lines.value.some(item => !bySlug.value.has(item.slug)
  || (item.format === 'one_of_one' && !bySlug.value.get(item.slug)?.oneOfOneAvailable)))
onMounted(hydrate)
useSeoMeta({ title: 'Checkout', description: 'Pay for and submit your astrophotography print order.' })

async function submit() {
  if (pending.value) return
  error.value = ''
  if (!lines.value.length || invalidLines.value) {
    error.value = 'An image is unavailable. Review your order and try again.'
    return
  }
  pending.value = true
  try {
    const result = await $fetch<{ reference: string, subtotal: number }>('/api/shop/orders', {
      method: 'POST', body: { ...customer, items: lines.value }
    })
    reference.value = result.reference
    placedSubtotal.value = result.subtotal
    clear()
  } catch (err) {
    const failure = err as { data?: { statusMessage?: string } }
    error.value = failure.data?.statusMessage || 'Your order could not be sent. Please try again.'
  } finally { pending.value = false }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6">
    <div class="py-14">
      <p class="text-emerald-400 uppercase tracking-widest text-sm">
        Almost there
      </p>
      <h1 class="text-4xl md:text-5xl font-semibold mt-3">
        Checkout
      </h1>
      <p class="text-slate-400 mt-3">
        Send the item subtotal, enter the transaction ID, and submit your order.
      </p>
    </div>
    <div
      v-if="reference"
      class="max-w-xl rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-8"
    >
      <h2 class="text-2xl font-semibold">
        Order request received
      </h2>
      <p class="text-slate-300 mt-3">
        Your payment transaction ID was recorded for an item subtotal of {{ money(placedSubtotal) }}. I’ll contact you about shipping.
      </p>
      <p class="text-sm text-slate-300 mt-5">
        Keep this reference: <strong class="text-white break-all">{{ reference }}</strong>
      </p>
      <UButton
        to="/shop/collection/all"
        color="success"
        class="mt-7"
      >
        Continue exploring
      </UButton>
    </div>
    <div
      v-else
      class="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]"
    >
      <form
        class="rounded-xl border border-slate-800 p-6 md:p-8 space-y-5"
        @submit.prevent="submit"
      >
        <h2 class="text-2xl font-medium">
          Contact and delivery
        </h2>
        <div
          class="hidden"
          aria-hidden="true"
        >
          <label>Website <input
            v-model="customer.website"
            tabindex="-1"
            autocomplete="off"
          ></label>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="text-sm text-slate-300">Full name *<input
            v-model.trim="customer.name"
            required
            maxlength="120"
            autocomplete="name"
            class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
          ></label>
          <label class="text-sm text-slate-300">Email *<input
            v-model.trim="customer.email"
            required
            type="email"
            maxlength="254"
            autocomplete="email"
            class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
          ></label>
          <label class="text-sm text-slate-300">Phone<input
            v-model.trim="customer.phone"
            type="tel"
            maxlength="50"
            autocomplete="tel"
            class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
          ></label>
          <label class="text-sm text-slate-300">Country *<input
            v-model.trim="customer.country"
            required
            maxlength="100"
            autocomplete="country-name"
            class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
          ></label>
        </div>
        <label class="block text-sm text-slate-300">Shipping address *<textarea
          v-model.trim="customer.address"
          required
          rows="3"
          maxlength="500"
          autocomplete="street-address"
          class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
        /></label>
        <section class="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-5">
          <p class="text-xs font-medium uppercase tracking-widest text-emerald-300">
            Payment
          </p>
          <p class="mt-2 text-sm text-slate-200">
            Send <strong class="text-white">{{ money(subtotal) }}</strong> to
            <strong class="whitespace-nowrap text-emerald-300">{{ shopPaymentNumber }}</strong>,
            then enter the transaction ID below.
          </p>
        </section>
        <label class="block text-sm text-slate-300">Transaction ID *<input
          v-model.trim="customer.transactionId"
          required
          minlength="4"
          maxlength="120"
          autocomplete="off"
          placeholder="Enter the payment transaction ID"
          class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white uppercase"
        ></label>
        <label class="block text-sm text-slate-300">Notes or framing preferences<textarea
          v-model.trim="customer.notes"
          rows="3"
          maxlength="1000"
          class="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white"
        /></label>
        <p
          v-if="error"
          role="alert"
          class="text-red-400 text-sm"
        >
          {{ error }}
        </p>
        <UButton
          type="submit"
          block
          size="xl"
          color="success"
          :loading="pending"
          :disabled="!lines.length || invalidLines"
        >
          Complete order
        </UButton>
        <p class="text-xs text-slate-400">
          Your order is verified against the submitted transaction ID. Shipping is arranged separately.
        </p>
      </form>
      <aside class="rounded-xl border border-slate-800 p-6 md:p-8 self-start">
        <h2 class="text-2xl font-medium">
          Your images
        </h2>
        <p
          v-if="!lines.length"
          class="text-slate-400 mt-5"
        >
          Your order is empty. <NuxtLink
            to="/shop/collection/all"
            class="text-emerald-400 underline"
          >Explore the collection</NuxtLink>.
        </p>
        <ul
          v-else
          class="divide-y divide-slate-800 mt-5"
        >
          <li
            v-for="item in lines"
            :key="`${item.slug}-${item.format}`"
            class="flex gap-3 py-4 text-sm"
          >
            <img
              v-if="bySlug.get(item.slug)"
              :src="bySlug.get(item.slug)?.thumb"
              :alt="bySlug.get(item.slug)?.alt"
              class="size-16 rounded object-cover"
            >
            <div class="flex-1">
              <p class="font-medium">
                {{ bySlug.get(item.slug)?.title || item.slug }}
              </p><p class="text-slate-400 mt-1">
                {{ formatLabel(item.format) }} · {{ printSize }} · Qty {{ item.quantity }}
              </p>
            </div>
            <span>{{ money(prices[item.format] * item.quantity) }}</span>
          </li>
        </ul>
        <div class="border-t border-slate-800 pt-5 mt-3 flex justify-between font-semibold">
          <span>Item subtotal</span><span>{{ money(subtotal) }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-3">
          Shipping is arranged separately.
        </p>
      </aside>
    </div>
  </div>
</template>
