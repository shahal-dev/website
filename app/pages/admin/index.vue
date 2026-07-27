<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin', robots: 'noindex, nofollow' })

const supabase = useSupabase()

const counts = ref<Record<string, number | null>>({
  gallery_photos: null,
  projects: null,
  posts: null,
  publications: null
})

const cards = [
  { key: 'gallery_photos', label: 'Gallery photos', to: '/admin/gallery', icon: 'i-lucide-camera' },
  { key: 'projects', label: 'Projects', to: '/admin/projects', icon: 'i-lucide-folder' },
  { key: 'posts', label: 'Blog posts', to: '/admin/blog', icon: 'i-lucide-file-text' },
  { key: 'publications', label: 'Publications', to: '/admin/publications', icon: 'i-lucide-graduation-cap' }
]

onMounted(async () => {
  await Promise.all(Object.keys(counts.value).map(async (table) => {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    counts.value[table] = count ?? 0
  }))
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-highlighted">
      Content
    </h1>
    <p class="mt-1 text-sm text-muted">
      Everything here is live on the site within a minute of saving.
    </p>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UPageCard
        v-for="card in cards"
        :key="card.key"
        :to="card.to"
        :icon="card.icon"
        :title="card.label"
        variant="subtle"
        class="hover:bg-elevated/50"
      >
        <template #description>
          <span class="text-2xl font-semibold text-highlighted tabular-nums">
            {{ counts[card.key] ?? '—' }}
          </span>
        </template>
      </UPageCard>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <UPageCard
        to="/admin/pages"
        icon="i-lucide-file-pen-line"
        title="Pages"
        description="About, gallery intro and other standing copy."
        variant="subtle"
      />
      <UPageCard
        to="/admin/cv"
        icon="i-lucide-file-user"
        title="CV"
        description="Experience, education, publications — and both PDF downloads."
        variant="subtle"
      />
      <UPageCard
        to="/admin/import"
        icon="i-lucide-download"
        title="Import existing content"
        description="Pull the projects, posts, publications and CV out of the repository so they're editable here."
        variant="subtle"
      />
      <UPageCard
        to="/admin/gallery/new"
        icon="i-lucide-upload"
        title="Upload a photo"
        description="One file in, three versions out, straight into the gallery."
        variant="subtle"
      />
    </div>
  </div>
</template>
