/**
 * Adds a schema.org JSON-LD block to the page head.
 * Kept tiny on purpose — one helper instead of a whole SEO module.
 */
export function useJsonLd(data: MaybeRefOrGetter<Record<string, unknown>>) {
  useHead({
    script: [{
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({ '@context': 'https://schema.org', ...toValue(data) }))
    }]
  })
}

/** Absolute URL for the current site — schema.org wants fully qualified URLs. */
export function useSiteUrl() {
  const { public: config } = useRuntimeConfig()
  const base = String(config.siteUrl || '').replace(/\/$/, '')
  return (path = '') => (path.startsWith('http') ? path : `${base}${path}`)
}
