<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Pages — Admin', robots: 'noindex, nofollow' })

interface PageRow {
  key: string
  title: string
  description: string
  body: string
  data: Record<string, unknown>
}

const known = [
  { key: 'about', label: 'About', hint: 'The About page — intro text above the CV.' },
  { key: 'gallery', label: 'Gallery intro', hint: 'Heading and blurb at the top of /gallery.' },
  { key: 'home', label: 'Home', hint: 'Hero title, tagline and the About Me blurb on the homepage.' },
  { key: 'projects', label: 'Projects intro', hint: 'Heading and blurb at the top of /projects.' },
  { key: 'publications', label: 'Publications intro', hint: 'Heading and blurb at the top of /publications.' }
]

const supabase = useSupabase()
const toast = useToast()

const active = ref('about')
const form = ref<PageRow>({ key: 'about', title: '', description: '', body: '', data: {} })
const pending = ref(false)

async function load(key: string) {
  active.value = key
  pending.value = true
  try {
    const { data, error } = await supabase.from('pages').select('*').eq('key', key).maybeSingle()
    if (error) throw error
    form.value = data
      ? { key, title: data.title || '', description: data.description || '', body: data.body || '', data: data.data || {} }
      : { key, title: '', description: '', body: '', data: {} }
  } finally {
    pending.value = false
  }
}

async function submit() {
  pending.value = true
  try {
    const { error } = await supabase.from('pages').upsert(form.value, { onConflict: 'key' })
    if (error) throw error
    toast.add({ title: 'Saved', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Could not save', description: (error as Error).message, color: 'error' })
  } finally {
    pending.value = false
  }
}

onMounted(() => load('about'))
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-highlighted">
      Pages
    </h1>
    <p class="mt-1 text-sm text-muted">
      Standing copy that isn't a list of things.
    </p>

    <div class="mt-6 flex flex-wrap gap-1">
      <UButton
        v-for="page in known"
        :key="page.key"
        :label="page.label"
        :variant="active === page.key ? 'soft' : 'ghost'"
        color="neutral"
        size="sm"
        @click="load(page.key)"
      />
    </div>

    <p class="mt-3 text-xs text-dimmed">
      {{ known.find(page => page.key === active)?.hint }}
    </p>

    <div class="mt-6 flex max-w-3xl flex-col gap-5">
      <UFormField label="Title">
        <UInput
          v-model="form.title"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Description"
        hint="the line under the title"
      >
        <UTextarea
          v-model="form.description"
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <AdminMarkdownField
        v-model="form.body"
        label="Body"
        :rows="20"
      />

      <div class="flex justify-end">
        <UButton
          :loading="pending"
          label="Save"
          size="lg"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>
