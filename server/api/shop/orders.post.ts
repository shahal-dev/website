import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { shopCurrency, shopOptions, shopPrices, shopSize, type ShopFormat } from '~~/shared/utils/shop-pricing'

type OrderItem = { slug: string, format: ShopFormat, size: string, quantity: number }

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400, statusMessage: 'Invalid order' })
  // A hidden form field keeps simple bots from filling the orders table.
  if (body.website) return { reference: randomUUID() }

  const name = clean(body.name, 120)
  const email = clean(body.email, 254)
  const phone = clean(body.phone, 50)
  const country = clean(body.country, 100)
  const address = clean(body.address, 500)
  const notes = clean(body.notes, 1000)
  const transactionId = clean(body.transactionId, 120).toUpperCase()
  const rawItems = body.items
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !country || transactionId.length < 4 || !Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 20) {
    throw createError({ statusCode: 400, statusMessage: 'Complete the required details and choose at least one image.' })
  }

  const items: OrderItem[] = rawItems.map((item: unknown) => {
    const row = item as Record<string, unknown>
    return {
      slug: clean(row?.slug, 120),
      format: row?.format as OrderItem['format'],
      size: clean(row?.size, 80),
      quantity: Number(row?.quantity)
    }
  })
  if (items.some(item => !/^[a-z0-9][a-z0-9-]*$/.test(item.slug) || !shopOptions.some(option => option.format === item.format) || item.size !== shopSize || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > (item.format === 'one_of_one' ? 1 : 20)) || !address) {
    throw createError({ statusCode: 400, statusMessage: 'Check your image selections and shipping address.' })
  }
  const uniqueLines = new Set(items.map(item => `${item.slug}:${item.format}`))
  if (uniqueLines.size !== items.length) throw createError({ statusCode: 400, statusMessage: 'Duplicate order items are not allowed.' })

  const config = useRuntimeConfig(event)
  const url = config.public.supabaseUrl
  const key = config.public.supabaseAnonKey
  if (!url || !key) throw createError({ statusCode: 503, statusMessage: 'Ordering is unavailable right now.' })

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const slugs = [...new Set(items.map(item => item.slug))]
  const { data: photos, error: lookupError } = await supabase.from('gallery_photos')
    .select('slug,title,one_of_one_available')
    .in('slug', slugs).eq('published', true)
  if (lookupError) throw createError({ statusCode: 503, statusMessage: 'Could not check image availability.' })
  if (photos?.length !== slugs.length) throw createError({ statusCode: 400, statusMessage: 'One or more images are no longer available.' })

  const available = new Map(photos.map(photo => [photo.slug, photo]))
  const pricedItems = items.map((item) => {
    const photo = available.get(item.slug)!
    if (item.format === 'one_of_one' && !photo.one_of_one_available) throw createError({ statusCode: 400, statusMessage: 'A one of one copy is no longer available.' })
    const price = shopPrices[item.format]
    const unitCents = Math.round(price * 100)
    return { ...item, title: photo.title, unit_price: unitCents / 100, line_total: unitCents * item.quantity / 100 }
  })
  const subtotal = pricedItems.reduce((sum, item) => sum + Math.round(item.line_total * 100), 0) / 100
  const currency = shopCurrency
  const reference = randomUUID()
  const { error } = await supabase.from('shop_orders').insert({
    id: reference,
    customer_name: name,
    customer_email: email,
    customer_phone: phone || null,
    country,
    address: address || null,
    notes: notes || null,
    payment_transaction_id: transactionId,
    items: pricedItems,
    currency,
    subtotal
  })
  if (error) {
    console.error('[shop] Order insert failed:', error.message)
    if (error.code === '23505') {
      throw createError({ statusCode: 400, statusMessage: 'That transaction ID has already been used.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Could not submit the order. Please try again shortly.' })
  }
  return { reference, subtotal, currency }
})
