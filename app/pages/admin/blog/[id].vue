<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const isNew = computed(() => route.params.id === 'new')
useSeoMeta({ title: 'Edit post — Admin', robots: 'noindex, nofollow' })

interface PostRow {
  id?: string
  slug: string
  title: string
  description: string
  body: string
  image_url: string | null
  min_read: number
  published_on: string
  published: boolean
}

const blank = (): PostRow => ({
  slug: '', title: '', description: '', body: '', image_url: null,
  min_read: 3, published_on: new Date().toISOString().slice(0, 10), published: true
})

const form = ref<PostRow>(blank())
const { get, save, pending } = useAdminTable<PostRow>('posts')
const { uploadSingle, progress } = usePhotoUpload()
const toast = useToast()

onMounted(async () => {
  if (isNew.value) return
  const row = await get(String(route.params.id))
  if (row) form.value = { ...blank(), ...row }
})

watch(() => form.value.title, (title) => {
  if (isNew.value && !form.value.slug) {
    form.value.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
})

// Rough reading time, same rule the blog cards used before.
watch(() => form.value.body, (body) => {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  if (words) form.value.min_read = Math.max(1, Math.round(words / 200))
})

async function onImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    form.value.image_url = await uploadSingle(file, `blog/${form.value.slug || 'post'}`, 'cover')
  } catch (error) {
    toast.add({ title: 'Upload failed', description: (error as Error).message, color: 'error' })
  }
}

async function submit() {
  if (!form.value.title || !form.value.slug) {
    toast.add({ title: 'Title and slug are required', color: 'warning' })
    return
  }
  const saved = await save(form.value)
  if (isNew.value && saved?.id) await navigateTo(`/admin/blog/${saved.id}`)
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <ULink
          to="/admin/blog"
          class="text-sm text-muted"
        >
          ← Blog
        </ULink>
        <h1 class="mt-1 text-2xl font-semibold text-highlighted">
          {{ isNew ? 'New post' : form.title || 'Edit post' }}
        </h1>
      </div>
      <UButton
        :loading="pending"
        label="Save"
        @click="submit"
      />
    </div>

    <div class="flex flex-col gap-5">
      <UFormField label="Title">
        <UInput
          v-model="form.title"
          class="w-full"
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Slug">
          <UInput
            v-model="form.slug"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Date">
          <UInput
            v-model="form.published_on"
            type="date"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Read time"
          hint="minutes"
        >
          <UInput
            v-model.number="form.min_read"
            type="number"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Summary">
        <UTextarea
          v-model="form.description"
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Cover image">
        <div class="flex items-center gap-3">
          <img
            v-if="form.image_url"
            :src="form.image_url"
            alt=""
            class="h-16 w-24 rounded object-cover"
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

      <AdminMarkdownField
        v-model="form.body"
        label="Post"
        :rows="24"
      />

      <div class="flex items-center justify-between">
        <USwitch
          v-model="form.published"
          label="Published"
        />
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
