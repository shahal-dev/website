<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const isNew = computed(() => route.params.id === 'new')

useSeoMeta({ title: 'Edit photo — Admin', robots: 'noindex, nofollow' })

interface Frame { medium_url: string, full_url: string, caption?: string }

interface PhotoRow {
  id?: string
  slug: string
  title: string
  description: string
  object: string
  tag: string
  alt: string
  body: string
  thumb_url: string
  medium_url: string
  full_url: string
  frames: Frame[]
  reference: { src: string, label?: string, credit: string, url?: string } | null
  gear: Record<string, string>
  acquisition: Record<string, string>
  captured_on: string
  location: string
  latitude: number | null
  longitude: number | null
  one_of_one_available: boolean
  featured: boolean
  published: boolean
  sort_order: number
}

const blank: PhotoRow = {
  slug: '',
  title: '',
  description: '',
  object: '',
  tag: '',
  alt: '',
  body: '',
  thumb_url: '',
  medium_url: '',
  full_url: '',
  frames: [],
  reference: null,
  gear: {},
  acquisition: {},
  captured_on: '',
  location: '',
  latitude: null,
  longitude: null,
  one_of_one_available: true,
  featured: false,
  published: true,
  sort_order: 0
}

const form = ref<PhotoRow>({ ...blank })
const { get, save, pending } = useAdminTable<PhotoRow>('gallery_photos')
const { upload, uploadSingle, progress } = usePhotoUpload()
const toast = useToast()
const uploading = ref(false)

const folder = computed(() =>
  (form.value.object || form.value.title || form.value.slug || '').trim().replace(/\s+/g, '-')
)

onMounted(async () => {
  if (isNew.value) return
  const row = await get(String(route.params.id))
  if (row) form.value = { ...blank, ...row, frames: row.frames || [], gear: row.gear || {}, acquisition: row.acquisition || {} }
})

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

watch(() => form.value.title, (title) => {
  if (isNew.value && !form.value.slug) form.value.slug = slugify(title)
  if (isNew.value && !form.value.alt) form.value.alt = `${title} — astrophotograph by Shahal`
})

async function onMainFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await upload(file, folder.value || form.value.slug)
    form.value.thumb_url = result.thumb_url
    form.value.medium_url = result.medium_url
    form.value.full_url = result.full_url
    toast.add({ title: 'Photo uploaded', description: 'Thumbnail, display and full-resolution versions created.', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Upload failed', description: (error as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function onFrameFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const slot = form.value.frames.length + 2
    const result = await upload(file, `${folder.value}/${slot}`)
    form.value.frames.push({ medium_url: result.medium_url, full_url: result.full_url, caption: '' })
  } catch (error) {
    toast.add({ title: 'Upload failed', description: (error as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function onReferenceFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const url = await uploadSingle(file, folder.value, 'reference')
    form.value.reference = { src: url, label: 'Hubble', credit: '', ...(form.value.reference || {}) }
    form.value.reference.src = url
  } catch (error) {
    toast.add({ title: 'Upload failed', description: (error as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

// "23.8103, 90.4125" — the shape Google Maps puts on the clipboard.
const coordinatePaste = ref('')

function applyCoordinatePaste() {
  const match = coordinatePaste.value.match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return
  form.value.latitude = Number(match[1])
  form.value.longitude = Number(match[2])
  coordinatePaste.value = ''
}

function onCoordinatePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (!text) return
  event.preventDefault()
  coordinatePaste.value = text
  applyCoordinatePaste()
}

function clearCoordinates() {
  form.value.latitude = null
  form.value.longitude = null
}

/** Empty inputs come back as '' — the column wants a number or null. */
function toNumberOrNull(value: unknown) {
  const number = Number(value)
  return value === '' || value === null || value === undefined || Number.isNaN(number) ? null : number
}

async function submit() {
  if (!form.value.title || !form.value.slug) {
    toast.add({ title: 'Title and slug are required', color: 'warning' })
    return
  }
  if (!form.value.medium_url) {
    toast.add({ title: 'Upload a photo first', color: 'warning' })
    return
  }
  const payload = { ...form.value }
  if (!payload.reference?.src) payload.reference = null
  payload.latitude = toNumberOrNull(payload.latitude)
  payload.longitude = toNumberOrNull(payload.longitude)
  const saved = await save(payload)
  if (isNew.value && saved?.id) await navigateTo(`/admin/gallery/${saved.id}`)
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <ULink
          to="/admin/gallery"
          class="text-sm text-muted"
        >
          ← Gallery
        </ULink>
        <h1 class="mt-1 text-2xl font-semibold text-highlighted">
          {{ isNew ? 'New photo' : form.title || 'Edit photo' }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="!isNew && form.slug"
          :to="`/gallery/${form.slug}`"
          target="_blank"
          icon="i-lucide-external-link"
          color="neutral"
          variant="ghost"
          label="View"
        />
        <UButton
          :loading="pending || uploading"
          label="Save"
          @click="submit"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <!-- Upload -->
      <section class="rounded-lg border border-default p-4">
        <h2 class="mb-3 text-sm font-medium text-highlighted">
          Photo
        </h2>
        <div class="flex flex-wrap items-start gap-4">
          <img
            v-if="form.medium_url"
            :src="form.medium_url"
            alt=""
            class="h-32 w-48 rounded object-cover"
          >
          <div class="flex-1">
            <input
              type="file"
              accept="image/*"
              class="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm file:text-default"
              @change="onMainFile"
            >
            <p class="mt-2 text-xs text-dimmed">
              One file in — thumbnail (400 px), display (1600 px) and full resolution are created and uploaded automatically to
              <code>photos/{{ folder || 'folder' }}/</code>.
            </p>
            <p
              v-if="progress"
              class="mt-1 text-xs text-primary"
            >
              {{ progress }}
            </p>
          </div>
        </div>
      </section>

      <!-- Basics -->
      <section class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Title">
          <UInput
            v-model="form.title"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Slug"
          hint="URL"
        >
          <UInput
            v-model="form.slug"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Object"
          class="sm:col-span-2"
        >
          <UInput
            v-model="form.object"
            placeholder="M31 / NGC 2264 / Milky Way"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Short description"
          class="sm:col-span-2"
        >
          <UInput
            v-model="form.description"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Category">
          <UInput
            v-model="form.tag"
            placeholder="Deep sky / Galaxy / Wide field"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Alt text">
          <UInput
            v-model="form.alt"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Date">
          <UInput
            v-model="form.captured_on"
            placeholder="2026-01-14"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Location">
          <UInput
            v-model="form.location"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Coordinates"
          class="sm:col-span-2"
          help="Where you shot from — this is what puts the photo on the gallery map. Paste a “lat, lng” pair straight from Google Maps, or leave empty to keep the photo off the map."
        >
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="coordinatePaste"
              placeholder="23.8103, 90.4125"
              class="w-56"
              @paste="onCoordinatePaste"
              @keydown.enter.prevent="applyCoordinatePaste"
              @blur="applyCoordinatePaste"
            />
            <UInput
              v-model="form.latitude"
              type="number"
              step="any"
              placeholder="Latitude"
              class="w-36"
            />
            <UInput
              v-model="form.longitude"
              type="number"
              step="any"
              placeholder="Longitude"
              class="w-36"
            />
            <UButton
              v-if="form.latitude !== null || form.longitude !== null"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              label="Clear"
              @click="clearCoordinates"
            />
          </div>
        </UFormField>
      </section>

      <!-- Story -->
      <AdminMarkdownField
        v-model="form.body"
        label="The story"
      />

      <!-- Extra frames -->
      <section class="rounded-lg border border-default p-4">
        <h2 class="mb-1 text-sm font-medium text-highlighted">
          Extra frames
        </h2>
        <p class="mb-3 text-xs text-dimmed">
          Shown in the carousel after the main photo.
        </p>

        <div
          v-for="(frame, index) in form.frames"
          :key="index"
          class="mb-3 flex items-start gap-3"
        >
          <img
            :src="frame.medium_url"
            alt=""
            class="size-16 rounded object-cover"
          >
          <UInput
            v-model="frame.caption"
            placeholder="Caption"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Remove frame"
            @click="form.frames.splice(index, 1)"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          class="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm file:text-default"
          @change="onFrameFile"
        >
      </section>

      <!-- Reference comparison -->
      <section class="rounded-lg border border-default p-4">
        <h2 class="mb-1 text-sm font-medium text-highlighted">
          Professional comparison
        </h2>
        <p class="mb-3 text-xs text-dimmed">
          Add a Hubble/JWST/survey frame of the same object and the drag-to-compare slider appears on the page.
        </p>

        <div
          v-if="form.reference?.src"
          class="mb-3 flex items-start gap-3"
        >
          <img
            :src="form.reference.src"
            alt=""
            class="size-16 rounded object-cover"
          >
          <div class="grid flex-1 gap-2">
            <UInput
              v-model="form.reference.label"
              placeholder="Label (e.g. Hubble)"
            />
            <UInput
              v-model="form.reference.credit"
              placeholder="Credit — required (e.g. NASA, ESA and the Hubble Heritage Team)"
            />
            <UInput
              v-model="form.reference.url"
              placeholder="Source URL (optional)"
            />
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Remove reference"
            @click="form.reference = null"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          class="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-sm file:text-default"
          @change="onReferenceFile"
        >
      </section>

      <!-- Gear + acquisition -->
      <section class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Telescope / lens">
          <UInput
            :model-value="form.gear.telescope"
            class="w-full"
            @update:model-value="form.gear.telescope = String($event)"
          />
        </UFormField>
        <UFormField label="Camera">
          <UInput
            :model-value="form.gear.camera"
            class="w-full"
            @update:model-value="form.gear.camera = String($event)"
          />
        </UFormField>
        <UFormField label="Mount">
          <UInput
            :model-value="form.gear.mount"
            class="w-full"
            @update:model-value="form.gear.mount = String($event)"
          />
        </UFormField>
        <UFormField label="Filters">
          <UInput
            :model-value="form.gear.filters"
            class="w-full"
            @update:model-value="form.gear.filters = String($event)"
          />
        </UFormField>
        <UFormField label="Exposures">
          <UInput
            :model-value="form.acquisition.exposures"
            placeholder="120 × 90 s"
            class="w-full"
            @update:model-value="form.acquisition.exposures = String($event)"
          />
        </UFormField>
        <UFormField label="Integration">
          <UInput
            :model-value="form.acquisition.integration"
            placeholder="3 h"
            class="w-full"
            @update:model-value="form.acquisition.integration = String($event)"
          />
        </UFormField>
        <UFormField label="Sky">
          <UInput
            :model-value="form.acquisition.sky"
            placeholder="Bortle 4"
            class="w-full"
            @update:model-value="form.acquisition.sky = String($event)"
          />
        </UFormField>
      </section>

      <!-- Flags -->
      <section class="flex flex-wrap items-center gap-6 rounded-lg border border-default p-4">
        <USwitch
          v-model="form.published"
          label="Published"
        />
        <USwitch
          v-model="form.featured"
          label="Featured"
        />
        <USwitch
          v-model="form.one_of_one_available"
          label="One of one available"
        />
        <UFormField
          label="Sort order"
          class="ml-auto"
        >
          <UInput
            v-model.number="form.sort_order"
            type="number"
            class="w-24"
          />
        </UFormField>
      </section>

      <div class="flex justify-end">
        <UButton
          :loading="pending || uploading"
          label="Save"
          size="lg"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>
