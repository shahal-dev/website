/**
 * Sitemap built from the live content, so photos, posts and projects added in
 * the admin are discoverable without a redeploy.
 */
interface Entry { loc: string, lastmod?: string, changefreq?: string, priority?: string }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.siteUrl || '').replace(/\/$/, '')

  const staticRoutes: Entry[] = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.9' },
    { loc: '/gallery', changefreq: 'weekly', priority: '0.9' },
    { loc: '/shop', changefreq: 'weekly', priority: '0.8' },
    { loc: '/shop/collection/all', changefreq: 'weekly', priority: '0.7' },
    { loc: '/projects', changefreq: 'monthly', priority: '0.8' },
    { loc: '/publications', changefreq: 'monthly', priority: '0.8' },
    { loc: '/blog', changefreq: 'weekly', priority: '0.7' }
  ]

  const entries: Entry[] = [...staticRoutes]

  // Dynamic sections — a failure here must not take the sitemap down.
  try {
    const gallery = await event.$fetch<{ items: Array<{ path: string, slug: string }> }>('/api/content/gallery')
    for (const photo of gallery.items || []) {
      entries.push({ loc: photo.path, changefreq: 'monthly', priority: '0.7' })
      entries.push({ loc: `/shop/product/${encodeURIComponent(photo.slug)}`, changefreq: 'monthly', priority: '0.6' })
    }
  } catch {
    // ignore
  }

  try {
    const posts = await event.$fetch<{ items: Array<{ path: string, date?: string }> }>('/api/content/posts')
    for (const post of posts.items || []) {
      entries.push({
        loc: post.path,
        lastmod: post.date ? String(post.date).slice(0, 10) : undefined,
        changefreq: 'yearly',
        priority: '0.6'
      })
    }
  } catch {
    // ignore
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${base}${entry.loc === '/' ? '' : entry.loc}</loc>${entry.lastmod
      ? `
    <lastmod>${entry.lastmod}</lastmod>`
      : ''}${entry.changefreq
      ? `
    <changefreq>${entry.changefreq}</changefreq>`
      : ''}${entry.priority
      ? `
    <priority>${entry.priority}</priority>`
      : ''}
  </url>`).join('\n')}
</urlset>
`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=3600')
  return body
})
