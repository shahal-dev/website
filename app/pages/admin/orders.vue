<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/shop-pricing'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Orders — Admin', robots: 'noindex, nofollow' })

interface Item { slug: string, title: string, format: string, size: string, quantity: number, line_total?: number }
interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  country: string
  address: string | null
  notes: string | null
  payment_transaction_id: string | null
  items: Item[]
  currency: string
  subtotal: number
  status: 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}
const supabase = useSupabase()
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref('')
const statuses: Order['status'][] = ['new', 'contacted', 'confirmed', 'completed', 'cancelled']

async function load() {
  loading.value = true
  const result = await supabase.from('shop_orders').select('*').order('created_at', { ascending: false })
  orders.value = (result.data || []) as Order[]
  error.value = result.error?.message || ''
  loading.value = false
}
async function changeStatus(order: Order, status: Order['status']) {
  if (status === order.status) return
  error.value = ''
  saving.value = order.id
  const { error: updateError } = await supabase.from('shop_orders').update({ status }).eq('id', order.id)
  if (updateError) error.value = updateError.message
  else order.status = status
  saving.value = ''
}
onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Shop orders
        </h1>
        <p class="mt-1 text-sm text-muted">
          Review requests, contact customers, and track progress.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        label="Refresh"
        color="neutral"
        variant="outline"
        @click="load"
      />
    </div>
    <p
      v-if="error"
      role="alert"
      class="mt-6 text-sm text-error"
    >
      {{ error }}
    </p>
    <p
      v-if="loading"
      class="mt-8 text-sm text-muted"
    >
      Loading orders…
    </p>
    <p
      v-else-if="!orders.length && !error"
      class="mt-8 text-sm text-muted"
    >
      No orders yet.
    </p>
    <div
      v-else
      class="mt-8 space-y-5"
    >
      <article
        v-for="order in orders"
        :key="order.id"
        class="rounded-xl border border-default p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-highlighted">
              {{ order.customer_name }}
            </h2>
            <p class="mt-1 text-xs text-muted">
              {{ new Date(order.created_at).toLocaleString() }} · {{ order.id }}
            </p>
          </div>
          <label class="text-xs text-muted">Status
            <select
              :value="order.status"
              :disabled="saving === order.id"
              class="ml-2 rounded-md border border-default bg-default p-2 text-sm text-highlighted"
              @change="changeStatus(order, ($event.target as HTMLSelectElement).value as Order['status'])"
            >
              <option
                v-for="status in statuses"
                :key="status"
                :value="status"
              >{{ status }}</option>
            </select>
          </label>
        </div>
        <div class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div class="space-y-1 text-muted">
            <p>
              <a
                :href="`mailto:${order.customer_email}`"
                class="text-primary underline"
              >{{ order.customer_email }}</a>
            </p>
            <p v-if="order.customer_phone">
              {{ order.customer_phone }}
            </p>
            <p>{{ order.country }}</p>
            <p v-if="order.payment_transaction_id">
              Transaction ID: <strong class="text-highlighted">{{ order.payment_transaction_id }}</strong>
            </p>
            <p
              v-if="order.address"
              class="whitespace-pre-line"
            >
              {{ order.address }}
            </p>
          </div>
          <div>
            <h3 class="font-medium text-highlighted">
              Items
            </h3>
            <ul class="mt-2 space-y-2 text-muted">
              <li
                v-for="(item, index) in order.items"
                :key="index"
              >
                {{ item.quantity }} × {{ item.title }} · {{ item.format }} · {{ item.size }}<span v-if="item.line_total !== undefined"> · {{ formatMoney(item.line_total, order.currency) }}</span>
              </li>
            </ul>
            <p
              v-if="order.subtotal"
              class="mt-3 font-semibold text-highlighted"
            >
              Item subtotal: {{ formatMoney(order.subtotal, order.currency) }}
            </p>
            <p
              v-if="order.notes"
              class="mt-4 whitespace-pre-line text-muted"
            >
              {{ order.notes }}
            </p>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
