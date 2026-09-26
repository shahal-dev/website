export type ShopFormat = 'print' | 'framed' | 'one_of_one'
export const shopCurrency = 'BDT'
export const shopSize = '24 in long side (short side varies)'
export const shopPaymentNumber = '+8801877585773'
export const shopPrices: Record<ShopFormat, number> = {
  print: 4000,
  framed: 6000,
  one_of_one: 10000
}
export const shopOptions: { format: ShopFormat, label: string, price: number }[] = [
  { format: 'print', label: 'Fine art print', price: shopPrices.print },
  { format: 'framed', label: 'Framed print', price: shopPrices.framed },
  { format: 'one_of_one', label: 'One of one copy', price: shopPrices.one_of_one }
]

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}
