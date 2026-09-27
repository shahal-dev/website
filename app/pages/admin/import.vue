<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Import — Admin', robots: 'noindex, nofollow' })

/**
 * Copies whatever the site is still serving from the files in content/ into
 * Supabase, so it becomes editable in the admin. Upserts by slug/key, so
 * running it twice is harmless — but it will overwrite database edits with the
 * file version, which is why each collection is a deliberate button press.
 */

const supabase = useSupabase()
const toast = useToast()

interface Row { count: number, done: boolean, pending: boolean, error?: string }

const state = reactive<Record<string, Row>>({
  projects: { count: 0, done: false, pending: false },
  posts: { count: 0, done: false, pending: false },
  publications: { count: 0, done: false, pending: false },
  pages: { count: 0, done: false, pending: false },
  cv: { count: 0, done: false, pending: false }
})

const sources = ref<Record<string, unknown>>({})

async function survey() {
  const [projects, posts, publications, cv, about, home] = await Promise.all([
    $fetch<{ source: string, items: unknown[] }>('/api/content/projects'),
    $fetch<{ source: string, items: unknown[] }>('/api/content/posts'),
    $fetch<{ source: string, items: unknown[] }>('/api/content/publications'),
    $fetch<{ source: string, item: unknown }>('/api/content/cv'),
    $fetch<{ source: string, item: unknown }>('/api/content/pages/about'),
    $fetch<{ source: string, item: unknown }>('/api/content/pages/index')
  ])

  sources.value = { projects, posts, publications, cv, about, home }

  state.projects.count = projects.items?.length || 0
  state.posts.count = posts.items?.length || 0
  state.publications.count = publications.items?.length || 0
  state.cv.count = cv.item ? 1 : 0
  state.pages.count = [about.item, home.item].filter(Boolean).length

  // Anything already coming from the database doesn't need importing.
  state.projects.done = projects.source === 'supabase'
  state.posts.done = posts.source === 'supabase'
  state.publications.done = publications.source === 'supabase'
  state.cv.done = cv.source === 'supabase'
}

function slugify(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function run(key: string, work: () => Promise<void>) {
  state[key]!.pending = true
  state[key]!.error = undefined
  try {
    await work()
    state[key]!.done = true
    toast.add({ title: `Imported ${key}`, icon: 'i-lucide-check-circle', color: 'success' })
  } catch (error) {
    state[key]!.error = (error as Error).message
    toast.add({ title: `Could not import ${key}`, description: (error as Error).message, color: 'error' })
  } finally {
    state[key]!.pending = false
  }
}

function importProjects() {
  return run('projects', async () => {
    const items = (sources.value.projects as { items: Record<string, unknown>[] }).items || []
    const rows = items.map((item, index) => ({
      slug: item.slug || slugify(String(item.title)),
      title: item.title,
      description: item.description || '',
      supervisor: item.supervisor || null,
      items: item.items || [],
      image_url: item.image || null,
      url: item.url || '#',
      tags: item.tags || [],
      year: String(item.date || ''),
      published: true,
      sort_order: index
    }))
    if (!rows.length) return
    const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
  })
}

function importPosts() {
  return run('posts', async () => {
    const items = (sources.value.posts as { items: Record<string, unknown>[] }).items || []
    const rows = items.map(item => ({
      slug: String(item.path || '').split('/').pop() || slugify(String(item.title)),
      title: item.title,
      description: item.description || '',
      body: item.body || '',
      image_url: item.image || null,
      min_read: item.minRead || 3,
      published_on: item.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      published: true
    }))
    if (!rows.length) return
    const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
  })
}

function importPublications() {
  return run('publications', async () => {
    const items = (sources.value.publications as { items: Record<string, unknown>[] }).items || []
    const rows = items.map((item, index) => ({
      category: item.category,
      title: item.title,
      detail: item.location || '',
      published_on: item.date ? String(item.date).slice(0, 10) : null,
      url: item.url || null,
      published: true,
      sort_order: index
    }))
    if (!rows.length) return
    // Publications have no natural key, so replace the set.
    await supabase.from('publications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('publications').insert(rows)
    if (error) throw error
  })
}

function importPages() {
  return run('pages', async () => {
    const about = (sources.value.about as { item: Record<string, unknown> })?.item
    const home = (sources.value.home as { item: Record<string, unknown> })?.item
    const rows = []
    if (about) {
      rows.push({
        key: 'about',
        title: about.title || '',
        description: about.description || '',
        body: String(about.content || about.body || ''),
        data: {}
      })
    }
    if (home) {
      rows.push({
        key: 'home',
        title: home.title || '',
        description: home.description || '',
        body: String((home.about as Record<string, unknown>)?.description || ''),
        data: { tagline: home.tagline || '' }
      })
    }
    if (!rows.length) return
    const { error } = await supabase.from('pages').upsert(rows, { onConflict: 'key' })
    if (error) throw error
  })
}

function importCv() {
  return run('cv', async () => {
    const cv = (sources.value.cv as { item: Record<string, unknown> })?.item
    if (!cv) return
    const { error } = await supabase.from('cv_documents')
      .upsert({ key: 'default', data: cv }, { onConflict: 'key' })
    if (error) throw error
  })
}

const actions = [
  { key: 'projects', label: 'Projects', hint: 'Title, description, link, tags, cover image', run: importProjects },
  { key: 'posts', label: 'Blog posts', hint: 'Markdown body, cover, dates', run: importPosts },
  { key: 'publications', label: 'Publications & awards', hint: 'Replaces the current set', run: importPublications },
  { key: 'pages', label: 'Page copy', hint: 'About page and homepage hero', run: importPages },
  { key: 'cv', label: 'CV', hint: 'Every section of the résumé', run: importCv }
]

async function importAll() {
  for (const action of actions) await action.run()
}

onMounted(survey)
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <h1 class="text-2xl font-semibold text-highlighted">
      Import existing content
    </h1>
    <p class="mt-1 text-sm text-muted">
      Copies what's still coming from the repository into the database, so you can
      edit it here. Safe to re-run — but it overwrites database edits with the
      file version, so only import a section once.
    </p>

    <ul class="mt-8 divide-y divide-default rounded-lg border border-default">
      <li
        v-for="action in actions"
        :key="action.key"
        class="flex items-center gap-4 p-4"
      >
        <div class="min-w-0 flex-1">
          <p class="font-medium text-highlighted">
            {{ action.label }}
          </p>
          <p class="text-xs text-muted">
            {{ action.hint }}
          </p>
          <p
            v-if="state[action.key]?.error"
            class="mt-1 text-xs text-error"
          >
            {{ state[action.key]?.error }}
          </p>
        </div>

        <span class="text-sm text-dimmed tabular-nums">
          {{ state[action.key]?.count ?? 0 }}
        </span>

        <UBadge
          v-if="state[action.key]?.done"
          color="success"
          variant="subtle"
          size="sm"
          label="In database"
        />
        <UButton
          v-else
          :loading="state[action.key]?.pending"
          :disabled="!state[action.key]?.count"
          color="neutral"
          variant="subtle"
          size="sm"
          label="Import"
          @click="action.run()"
        />
      </li>
    </ul>

    <div class="mt-6 flex items-center justify-between gap-4">
      <p class="text-xs text-dimmed">
        The gallery isn't listed — it lives only in the database, so add photos
        directly under Gallery.
      </p>
      <UButton
        label="Import everything"
        @click="importAll"
      />
    </div>
  </div>
</template>
