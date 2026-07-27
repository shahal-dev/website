/** RSS feed for the blog — helps discovery and lets readers subscribe. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.siteUrl || '').replace(/\/$/, '')

  let posts: Array<{ path: string, title: string, description?: string, date?: string }> = []
  try {
    const response = await event.$fetch<{ items: typeof posts }>('/api/content/posts')
    posts = response.items || []
  } catch {
    // an empty feed beats a 500
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MD Shahadat Hossain Shahal — Writing</title>
    <link>${base}/blog</link>
    <description>Notes on research, astrophotography, and the things I build.</description>
    <language>en</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}${post.path}</link>
      <guid isPermaLink="true">${base}${post.path}</guid>
      <description>${escapeXml(post.description || '')}</description>${post.date
        ? `
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`
        : ''}
    </item>`).join('\n')}
  </channel>
</rss>
`

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=3600')
  return body
})
