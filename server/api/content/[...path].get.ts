import { queryCollection } from '@nuxt/content/nitro'

/**
 * One endpoint for every content collection.
 *
 *   /api/content/gallery            → all published photos (database only)
 *   /api/content/gallery/<slug>     → one photo
 *   /api/content/projects
 *   /api/content/posts[/<slug>]
 *   /api/content/publications
 *   /api/content/pages/<key>
 *
 * Supabase is the source of truth once it's configured. Until then (and if it
 * ever goes down mid-request) the same shapes are built from the files in
 * content/, so the public site never depends on the database being reachable.
 */

type Dict = Record<string, unknown>

function mapGallery(row: Dict) {
  return {
    slug: row.slug,
    path: `/gallery/${row.slug}`,
    title: row.title,
    description: row.description,
    object: row.object,
    tag: row.tag,
    alt: row.alt,
    thumb: row.thumb_url,
    medium: row.medium_url,
    full: row.full_url,
    frames: row.frames || [],
    reference: row.reference || null,
    gear: row.gear || {},
    acquisition: row.acquisition || {},
    date: row.captured_on,
    location: row.location,
    featured: row.featured,
    body: row.body
  }
}

function mapProject(row: Dict) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image_url || undefined,
    url: row.url,
    tags: row.tags || [],
    date: row.year
  }
}

function mapPost(row: Dict) {
  return {
    slug: row.slug,
    path: `/blog/${row.slug}`,
    title: row.title,
    description: row.description,
    image: row.image_url,
    minRead: row.min_read,
    date: row.published_on,
    body: row.body
  }
}

function mapPublication(row: Dict) {
  return {
    category: row.category,
    title: row.title,
    location: row.detail,
    date: row.published_on,
    url: row.url || undefined
  }
}

export default defineCachedEventHandler(async (event) => {
  const segments = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  const [collection, slug] = segments

  if (!collection) {
    throw createError({ statusCode: 400, statusMessage: 'Missing collection' })
  }

  const supabase = serverSupabase()

  // ---- Supabase path ------------------------------------------------------
  // Any failure here (schema not applied yet, network blip, RLS surprise)
  // falls through to the file version rather than breaking the page.
  if (supabase) {
    try {
      if (collection === 'gallery') {
        const query = supabase.from('gallery_photos').select('*').eq('published', true)
        if (slug) {
          const { data, error } = await query.eq('slug', slug).maybeSingle()
          if (error) throw error
          if (data) return { source: 'supabase', item: mapGallery(data) }
          // not in the database (yet) — try the files
        } else {
          const { data, error } = await query.order('sort_order').order('created_at', { ascending: false })
          if (error) throw error
          if (data?.length) return { source: 'supabase', items: data.map(mapGallery) }
        }
      }

      if (collection === 'projects') {
        const { data, error } = await supabase.from('projects').select('*')
          .eq('published', true).order('sort_order').order('year', { ascending: false })
        if (error) throw error
        if (data?.length) return { source: 'supabase', items: data.map(mapProject) }
      }

      if (collection === 'posts') {
        const query = supabase.from('posts').select('*').eq('published', true)
        if (slug) {
          const { data, error } = await query.eq('slug', slug).maybeSingle()
          if (error) throw error
          if (data) return { source: 'supabase', item: mapPost(data) }
        } else {
          const { data, error } = await query.order('published_on', { ascending: false })
          if (error) throw error
          if (data?.length) return { source: 'supabase', items: data.map(mapPost) }
        }
      }

      if (collection === 'publications') {
        const { data, error } = await supabase.from('publications').select('*')
          .eq('published', true).order('sort_order').order('published_on', { ascending: false })
        if (error) throw error
        if (data?.length) return { source: 'supabase', items: data.map(mapPublication) }
      }

      if (collection === 'cv') {
        const { data, error } = await supabase.from('cv_documents').select('data').eq('key', 'default').maybeSingle()
        if (error) throw error
        if (data?.data && Object.keys(data.data).length) return { source: 'supabase', item: data.data }
        // fall through to the file version when the CV hasn't been seeded yet
      }

      if (collection === 'pages' && slug) {
        const { data, error } = await supabase.from('pages').select('*').eq('key', slug).maybeSingle()
        if (error) throw error
        if (data) return { source: 'supabase', item: data }
        // fall through to the file version when the page hasn't been created yet
      }
    } catch (error) {
      console.warn(`[content] Supabase read failed for "${collection}", using files:`, (error as Error).message)
    }
  }

  // ---- File fallback ------------------------------------------------------
  // The gallery is database-only: with no Supabase there is simply nothing to
  // show, rather than a stale copy in the repository.
  if (collection === 'gallery') {
    return slug ? { source: 'supabase', item: null } : { source: 'supabase', items: [] }
  }

  if (collection === 'projects') {
    const docs = await queryCollection(event, 'projects').all()
    return {
      source: 'files',
      items: docs.map(doc => ({
        slug: String(doc.stem || '').split('/').pop(),
        title: doc.title,
        description: doc.description,
        image: doc.image,
        url: doc.url,
        tags: doc.tags,
        date: doc.date
      }))
    }
  }

  if (collection === 'posts') {
    // `rawbody` is the markdown source — same shape the database rows use, so
    // the blog renders identically from either place.
    const stripFrontmatter = (raw: string) => raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim()
    const toPost = (doc: Dict) => ({ ...doc, body: stripFrontmatter(String(doc.rawbody || '')) })
    if (slug) {
      const doc = await queryCollection(event, 'blog').path(`/blog/${slug}`).first()
      return { source: 'files', item: doc ? toPost(doc as Dict) : null }
    }
    const docs = await queryCollection(event, 'blog').order('date', 'DESC').all()
    return { source: 'files', items: docs.map(doc => toPost(doc as Dict)) }
  }

  if (collection === 'publications') {
    const page = await queryCollection(event, 'publications').first()
    return { source: 'files', items: (page as Dict)?.events || [] }
  }

  if (collection === 'cv') {
    const doc = await queryCollection(event, 'cv').first()
    return { source: 'files', item: doc }
  }

  if (collection === 'cv') {
    const doc = await queryCollection(event, 'cv').first()
    return { source: 'files', item: doc }
  }

  if (collection === 'pages' && slug) {
    const map: Record<string, string> = {
      about: 'about',
      index: 'index'
    }
    const name = map[slug]
    if (!name) throw createError({ statusCode: 404, statusMessage: 'Unknown page' })
    const doc = await queryCollection(event, name as 'about').first()
    return { source: 'files', item: doc }
  }

  throw createError({ statusCode: 404, statusMessage: 'Unknown collection' })
}, {
  name: 'site-content',
  // Brief cache so a burst of requests doesn't hammer the database, short
  // enough that admin edits are visible almost immediately.
  maxAge: 10,
  swr: true,
  getKey: event => `content:${getRouterParam(event, 'path') || ''}`
})
