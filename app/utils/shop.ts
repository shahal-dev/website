/** Link a gallery image to its product page in this app. */
export function imageShopHref(slug: string) {
  return `/shop/product/${encodeURIComponent(slug)}`
}

export function shopHomeHref() {
  return '/shop'
}
