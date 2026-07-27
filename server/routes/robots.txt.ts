export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.siteUrl || '').replace(/\/$/, '')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=86400')

  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /cv/
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`
})
