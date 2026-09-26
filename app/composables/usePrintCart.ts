import { prices, printSize, type CartLine, type Photo, type PrintFormat } from '~~/app/types/shop'

export function usePrintCart() {
  const lines = useState<CartLine[]>('print-cart', () => [])
  const isCartOpen = useState('print-cart-open', () => false)
  const hydrated = useState('print-cart-hydrated', () => false)
  const count = computed(() => lines.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => lines.value.reduce((sum, item) => sum + prices[item.format] * item.quantity, 0))

  function hydrate() {
    if (hydrated.value || !import.meta.client) return
    hydrated.value = true
    try {
      const saved = JSON.parse(localStorage.getItem('image-shop-cart') || '[]')
      if (Array.isArray(saved)) {
        lines.value = saved.filter((item: CartLine) => item && typeof item.slug === 'string'
          && ['print', 'framed', 'one_of_one'].includes(item.format)
          && item.size === printSize
          && Number.isInteger(item.quantity) && item.quantity > 0
          && item.quantity <= (item.format === 'one_of_one' ? 1 : 20)).slice(0, 20)
      }
    } catch { /* Keep an empty cart if saved data is damaged. */ }
  }

  function persist() {
    if (!import.meta.client || !hydrated.value) return
    try {
      localStorage.setItem('image-shop-cart', JSON.stringify(lines.value))
    } catch { /* The cart still works for this visit. */ }
  }

  function add(photo: Photo, format: PrintFormat, quantity = 1) {
    hydrate()
    if (format === 'one_of_one' && !photo.oneOfOneAvailable) return
    const existing = lines.value.find(item => item.slug === photo.slug && item.format === format)
    const max = format === 'one_of_one' ? 1 : 20
    const amount = Math.max(1, Math.min(max, Math.floor(Number(quantity) || 1)))
    if (existing) existing.quantity = Math.min(max, existing.quantity + amount)
    else if (lines.value.length < 20) lines.value.push({ slug: photo.slug, format, size: printSize, quantity: amount })
    isCartOpen.value = true
    persist()
  }

  function update(slug: string, format: PrintFormat, quantity: number) {
    const item = lines.value.find(line => line.slug === slug && line.format === format)
    if (!item) return
    item.quantity = Math.max(1, Math.min(format === 'one_of_one' ? 1 : 20, Math.floor(quantity) || 1))
    persist()
  }

  function remove(slug: string, format: PrintFormat) {
    lines.value = lines.value.filter(item => item.slug !== slug || item.format !== format)
    persist()
  }

  function clear() {
    lines.value = []
    persist()
  }

  return { lines, isCartOpen, count, subtotal, hydrate, add, update, remove, clear }
}
