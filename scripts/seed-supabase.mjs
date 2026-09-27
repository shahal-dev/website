#!/usr/bin/env node
/**
 * One-time migration: push the content in content/ into Supabase.
 *
 * The gallery is not included — photos live only in the database and are
 * uploaded through the admin.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=… pnpm seed
 *
 * Safe to re-run — rows are upserted on their slug/key, files are overwritten.
 * The service-role key bypasses row level security, so it lives only in your
 * shell / .env and never in the deployed app.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { parse as parseYaml } from 'yaml'

const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set NUXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env).')
  process.exit(1)
}

if (serviceKey.startsWith('postgresql://') || serviceKey.startsWith('postgres://')) {
  console.error('SUPABASE_SERVICE_ROLE_KEY must be a Supabase service_role API key, not a PostgreSQL connection URL.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
const root = process.cwd()

const dryRun = process.argv.includes('--dry-run')

function log(...args) {
  console.log(...args)
}

/** Split `---\nfrontmatter\n---\nbody` into its two halves. */
function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw.trim() }
  return { data: parseYaml(match[1]) || {}, body: (match[2] || '').trim() }
}

// ---------------------------------------------------------------------------
//  Storage
// ---------------------------------------------------------------------------
const uploadCache = new Map()

async function uploadFile(localPath, storagePath) {
  if (uploadCache.has(storagePath)) return uploadCache.get(storagePath)

  const contentType = storagePath.endsWith('.webp')
    ? 'image/webp'
    : storagePath.endsWith('.json') ? 'application/json' : 'image/jpeg'

  if (!dryRun) {
    const body = await readFile(localPath)
    const { error } = await supabase.storage.from('photos').upload(storagePath, body, {
      contentType,
      upsert: true,
      cacheControl: '31536000'
    })
    if (error) throw new Error(`${storagePath}: ${error.message}`)
  }

  const publicUrl = supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl
  uploadCache.set(storagePath, publicUrl)
  return publicUrl
}

// ---------------------------------------------------------------------------
//  Projects
// ---------------------------------------------------------------------------
async function seedProjects() {
  const dir = path.join(root, 'content/projects')
  const files = (await readdir(dir)).filter(name => name.endsWith('.yml'))
  const rows = []

  for (const [index, file] of files.entries()) {
    const data = parseYaml(await readFile(path.join(dir, file), 'utf8'))
    let imageUrl = data.image || null

    // Local files move into storage; remote URLs are left alone.
    if (imageUrl?.startsWith('/')) {
      const localPath = path.join(root, 'public', imageUrl.replace(/^\//, ''))
      try {
        await stat(localPath)
        imageUrl = await uploadFile(localPath, `projects/${path.basename(imageUrl)}`)
      } catch {
        imageUrl = null
      }
    }

    rows.push({
      slug: file.replace(/\.yml$/, ''),
      title: data.title,
      description: data.description || '',
      supervisor: data.supervisor || null,
      items: data.items || [],
      image_url: imageUrl,
      url: data.url || '#',
      tags: data.tags || [],
      year: String(data.date || ''),
      published: true,
      sort_order: index
    })
  }

  log(`projects: ${rows.length} rows`)
  if (!dryRun && rows.length) {
    const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
//  Blog
// ---------------------------------------------------------------------------
async function seedPosts() {
  const dir = path.join(root, 'content/blog')
  const files = (await readdir(dir)).filter(name => name.endsWith('.md'))
  const rows = []

  for (const file of files) {
    const { data, body } = parseMarkdown(await readFile(path.join(dir, file), 'utf8'))
    let imageUrl = data.image || null

    if (imageUrl?.startsWith('/')) {
      const localPath = path.join(root, 'public', imageUrl.replace(/^\//, ''))
      try {
        await stat(localPath)
        imageUrl = await uploadFile(localPath, `blog/${path.basename(imageUrl)}`)
      } catch {
        imageUrl = null
      }
    }

    rows.push({
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      description: data.description || '',
      body,
      image_url: imageUrl,
      min_read: data.minRead || 3,
      published_on: data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      published: true
    })
  }

  log(`posts: ${rows.length} rows`)
  if (!dryRun && rows.length) {
    const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
//  Publications
// ---------------------------------------------------------------------------
async function seedPublications() {
  const data = parseYaml(await readFile(path.join(root, 'content/publications.yml'), 'utf8'))
  const rows = (data.events || []).map((event, index) => ({
    category: event.category,
    title: event.title,
    detail: event.location || '',
    published_on: event.date || null,
    url: event.url || null,
    published: true,
    sort_order: index
  }))

  log(`publications: ${rows.length} rows`)
  if (!dryRun && rows.length) {
    // No natural key here, so replace the set wholesale.
    await supabase.from('publications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('publications').insert(rows)
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
//  Page copy
// ---------------------------------------------------------------------------
async function seedPages() {
  const about = parseYaml(await readFile(path.join(root, 'content/about.yml'), 'utf8'))
  const index = parseYaml(await readFile(path.join(root, 'content/index.yml'), 'utf8'))
  const projects = parseYaml(await readFile(path.join(root, 'content/projects.yml'), 'utf8'))
  const publications = parseYaml(await readFile(path.join(root, 'content/publications.yml'), 'utf8'))

  const rows = [
    { key: 'about', title: about.title, description: about.description, body: about.content || '', data: {} },
    {
      key: 'home',
      title: index.title,
      description: index.description,
      body: index.about?.description || '',
      data: { tagline: index.tagline || '' }
    },
    { key: 'projects', title: projects.title, description: projects.description, body: '', data: {} },
    { key: 'publications', title: publications.title, description: publications.description, body: '', data: {} }
  ]

  log(`pages: ${rows.length} rows`)
  if (!dryRun) {
    const { error } = await supabase.from('pages').upsert(rows, { onConflict: 'key' })
    if (error) throw error
  }
}

async function seedCv() {
  const cv = parseYaml(await readFile(path.join(root, 'content/cv.yml'), 'utf8'))
  log('cv_documents: 1 row')
  if (!dryRun) {
    const { error } = await supabase.from('cv_documents')
      .upsert({ key: 'default', data: cv }, { onConflict: 'key' })
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
try {
  log(dryRun ? '— dry run —' : `Seeding ${url}`)
  await seedProjects()
  await seedPosts()
  await seedPublications()
  await seedPages()
  await seedCv()
  log('\n✔ Done. The site now reads from Supabase; the files in content/ stay as a fallback.')
} catch (error) {
  console.error('\n✖ Seed failed:', error.message)
  process.exit(1)
}
