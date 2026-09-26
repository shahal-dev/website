import { formatMoney, shopCurrency, shopOptions, shopPrices, shopSize, type ShopFormat } from '~~/shared/utils/shop-pricing'

export type PrintFormat = ShopFormat
export interface Photo {
  slug: string
  path: string
  title: string
  description: string
  alt: string
  thumb: string
  medium: string
  full: string
  tag: string | null
  oneOfOneAvailable: boolean
}
export interface CartLine {
  slug: string
  format: PrintFormat
  size: string
  quantity: number
}
export const currency = shopCurrency
export const printSize = shopSize
export const prices = shopPrices
export const formats = shopOptions.map(option => ({ value: option.format, label: option.label }))
export const money = (value: number) => formatMoney(value, shopCurrency)
export const formatLabel = (value: PrintFormat) => formats.find(format => format.value === value)?.label || value
