<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'CV — Admin', robots: 'noindex, nofollow' })

type Entry = Record<string, unknown>

interface CvDocument {
  name: string
  role: string
  summary: string
  location: string
  phone: string
  email: string
  links: Entry[]
  skills: Entry[]
  experience: Entry[]
  education: Entry[]
  publications: Entry[]
  teaching: Entry[]
  awards: Entry[]
  projects: Entry[]
  outreach: Entry[]
  languages: string[]
}

const empty: CvDocument = {
  name: '', role: '', summary: '', location: '', phone: '', email: '',
  links: [], skills: [], experience: [], education: [], publications: [],
  teaching: [], awards: [], projects: [], outreach: [], languages: []
}

const supabase = useSupabase()
const toast = useToast()

const cv = ref<CvDocument>({ ...empty })
const pending = ref(false)
const loadedFrom = ref<'supabase' | 'files' | null>(null)

const languagesText = computed({
  get: () => (cv.value.languages || []).join('\n'),
  set: (value: string) => {
    cv.value.languages = value.split('\n').map(line => line.trim()).filter(Boolean)
  }
})

/**
 * `compact: true` marks an entry as belonging on the one-page CV; the full
 * résumé always shows everything.
 */
const compactField = { key: 'compact', label: 'On the one-page CV', type: 'switch' as const }

const sections = {
  experience: [
    { key: 'role', label: 'Role' },
    { key: 'organisation', label: 'Organisation' },
    { key: 'date', label: 'Dates', placeholder: 'Jan 2026 – Present' },
    compactField,
    { key: 'details', label: 'Bullet points', type: 'lines' as const }
  ],
  education: [
    { key: 'institution', label: 'Institution' },
    { key: 'degree', label: 'Degree' },
    { key: 'date', label: 'Dates' },
    compactField,
    { key: 'details', label: 'Bullet points', type: 'lines' as const }
  ],
  publications: [
    { key: 'title', label: 'Title', wide: true },
    { key: 'authors', label: 'Authors', wide: true },
    { key: 'venue', label: 'Venue' },
    { key: 'date', label: 'Year' },
    { key: 'url', label: 'Link' },
    compactField
  ],
  teaching: [
    { key: 'title', label: 'Title', wide: true },
    { key: 'detail', label: 'Detail', wide: true },
    { key: 'date', label: 'Date' },
    compactField
  ],
  awards: [
    { key: 'title', label: 'Award', wide: true },
    { key: 'detail', label: 'Detail', wide: true },
    { key: 'date', label: 'Year' },
    compactField
  ],
  projects: [
    { key: 'title', label: 'Project' },
    { key: 'url', label: 'Link' },
    { key: 'detail', label: 'Description', type: 'textarea' as const },
    compactField
  ],
  outreach: [
    { key: 'title', label: 'Title', wide: true },
    { key: 'detail', label: 'Detail', type: 'textarea' as const },
    compactField
  ],
  skills: [
    { key: 'group', label: 'Group' },
    compactField,
    { key: 'items', label: 'Skills', type: 'lines' as const }
  ],
  links: [
    { key: 'label', label: 'Label' },
    { key: 'url', label: 'URL' }
  ]
}

async function load() {
  pending.value = true
  try {
    const { data } = await supabase.from('cv_documents').select('data').eq('key', 'default').maybeSingle()
    if (data?.data && Object.keys(data.data).length) {
      cv.value = { ...empty, ...(data.data as CvDocument) }
      loadedFrom.value = 'supabase'
      return
    }
    // Nothing saved yet — start from whatever the site is serving today.
    const fromApi = await $fetch<{ item: CvDocument }>('/api/content/cv')
    cv.value = { ...empty, ...(fromApi.item || {}) }
    loadedFrom.value = 'files'
  } finally {
    pending.value = false
  }
}

async function save() {
  pending.value = true
  try {
    const { error } = await supabase.from('cv_documents')
      .upsert({ key: 'default', data: cv.value }, { onConflict: 'key' })
    if (error) throw error
    loadedFrom.value = 'supabase'
    toast.add({ title: 'CV saved', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Could not save', description: (error as Error).message, color: 'error' })
  } finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          CV
        </h1>
        <p class="mt-1 text-sm text-muted">
          Drives the About page and both PDF downloads.
          <span v-if="loadedFrom === 'files'">Currently showing the version from the repository — saving copies it into the database.</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          to="/cv/compact"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-lucide-file-text"
          label="One-page"
        />
        <UButton
          to="/cv/full"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-lucide-file-text"
          label="Full"
        />
        <UButton
          :loading="pending"
          label="Save"
          @click="save"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <section class="grid gap-4 rounded-lg border border-default p-4 sm:grid-cols-2">
        <UFormField label="Name">
          <UInput
            v-model="cv.name"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Role">
          <UInput
            v-model="cv.role"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Location">
          <UInput
            v-model="cv.location"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Phone">
          <UInput
            v-model="cv.phone"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Email">
          <UInput
            v-model="cv.email"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Languages"
          hint="one per line"
        >
          <UTextarea
            v-model="languagesText"
            :rows="2"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Summary"
          class="sm:col-span-2"
        >
          <UTextarea
            v-model="cv.summary"
            :rows="4"
            class="w-full"
          />
        </UFormField>
      </section>

      <AdminEntryList
        v-model="cv.links"
        title="Profile links"
        :fields="sections.links"
        label-key="label"
      />
      <AdminEntryList
        v-model="cv.skills"
        title="Technical skills"
        hint="One group per row."
        :fields="sections.skills"
        label-key="group"
      />
      <AdminEntryList
        v-model="cv.experience"
        title="Experience"
        :fields="sections.experience"
        label-key="role"
      />
      <AdminEntryList
        v-model="cv.education"
        title="Education"
        :fields="sections.education"
        label-key="institution"
      />
      <AdminEntryList
        v-model="cv.publications"
        title="Publications"
        :fields="sections.publications"
        label-key="title"
      />
      <AdminEntryList
        v-model="cv.projects"
        title="Selected projects"
        :fields="sections.projects"
        label-key="title"
      />
      <AdminEntryList
        v-model="cv.teaching"
        title="Teaching"
        :fields="sections.teaching"
        label-key="title"
      />
      <AdminEntryList
        v-model="cv.awards"
        title="Awards & honours"
        :fields="sections.awards"
        label-key="title"
      />
      <AdminEntryList
        v-model="cv.outreach"
        title="Outreach"
        :fields="sections.outreach"
        label-key="title"
      />

      <div class="flex justify-end">
        <UButton
          :loading="pending"
          label="Save CV"
          size="lg"
          @click="save"
        />
      </div>
    </div>
  </div>
</template>
