<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Projects — Admin', robots: 'noindex, nofollow' })

interface ProjectRow {
  id?: string
  slug: string
  title: string
  description: string
  image_url: string | null
  url: string
  tags: string[]
  year: string
  published: boolean
  sort_order: number
}

const blank = (): ProjectRow => ({
  slug: '', title: '', description: '', image_url: null, url: '#',
  tags: [], year: String(new Date().getFullYear()), published: true, sort_order: 0
})

const { rows, pending, list, save, remove } = useAdminTable<ProjectRow>('projects', { orderBy: 'sort_order' })
const { uploadSingle, progress } = usePhotoUpload()
const toast = useToast()

const editing = ref<ProjectRow | null>(null)
const tagsInput = ref('')

onMounted(list)

function edit(row?: ProjectRow) {
  editing.value = row ? { ...row } : blank()
  tagsInput.value = (editing.value.tags || []).join(', ')
}

async function onImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !editing.value) return
  try {
    editing.value.image_url = await uploadSingle(file, `projects/${editing.value.slug || 'untitled'}`, 'cover')
  } catch (error) {
    toast.add({ title: 'Upload failed', description: (error as Error).message, color: 'error' })
  }
}

async function submit() {
  if (!editing.value) return
  editing.value.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean)
  if (!editing.value.slug) {
    editing.value.slug = editing.value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  await save(editing.value)
  editing.value = null
  await list()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-highlighted">
        Projects
      </h1>
      <UButton
        icon="i-lucide-plus"
        label="New project"
        @click="edit()"
      />
    </div>

    <ul class="mt-8 divide-y divide-default rounded-lg border border-default">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex items-center gap-4 p-3"
      >
        <img
          v-if="row.image_url"
          :src="row.image_url"
          alt=""
          class="size-12 shrink-0 rounded object-cover"
        >
        <div
          v-else
          class="flex size-12 shrink-0 items-center justify-center rounded bg-elevated"
        >
          <UIcon
            name="i-lucide-code-xml"
            class="size-5 text-muted"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ row.title }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ row.year }} · {{ (row.tags || []).join(' · ') }}
          </p>
        </div>

        <UBadge
          :color="row.published ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
          :label="row.published ? 'Live' : 'Draft'"
        />
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Edit"
          @click="edit(row)"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          aria-label="Delete"
          @click="row.id && window.confirm(`Delete “${row.title}”?`) && remove(row.id)"
        />
      </li>
    </ul>

    <UModal
      :open="Boolean(editing)"
      title="Project"
      @update:open="value => !value && (editing = null)"
    >
      <template #body>
        <div
          v-if="editing"
          class="flex flex-col gap-4"
        >
          <UFormField label="Title">
            <UInput
              v-model="editing.title"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Slug"
            hint="optional"
          >
            <UInput
              v-model="editing.slug"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="editing.description"
              :rows="4"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Link">
            <UInput
              v-model="editing.url"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Tags"
            hint="comma separated"
          >
            <UInput
              v-model="tagsInput"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Year">
            <UInput
              v-model="editing.year"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Cover image">
            <div class="flex items-center gap-3">
              <img
                v-if="editing.image_url"
                :src="editing.image_url"
                alt=""
                class="size-12 rounded object-cover"
              >
              <input
                type="file"
                accept="image/*"
                class="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm file:text-default"
                @change="onImage"
              >
            </div>
            <p
              v-if="progress"
              class="mt-1 text-xs text-primary"
            >
              {{ progress }}
            </p>
          </UFormField>
          <div class="flex items-center gap-6">
            <USwitch
              v-model="editing.published"
              label="Published"
            />
            <UFormField
              label="Sort order"
              class="ml-auto"
            >
              <UInput
                v-model.number="editing.sort_order"
                type="number"
                class="w-24"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="editing = null"
          />
          <UButton
            :loading="pending"
            label="Save"
            @click="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
