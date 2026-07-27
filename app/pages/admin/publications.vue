<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Publications — Admin', robots: 'noindex, nofollow' })

interface PublicationRow {
  id?: string
  category: 'Paper' | 'Preprint' | 'Thesis' | 'Award'
  title: string
  detail: string
  published_on: string | null
  url: string | null
  published: boolean
  sort_order: number
}

const categories = ['Paper', 'Preprint', 'Thesis', 'Award'] as const

const blank = (): PublicationRow => ({
  category: 'Paper', title: '', detail: '',
  published_on: new Date().toISOString().slice(0, 10), url: '', published: true, sort_order: 0
})

const { rows, pending, list, save, remove } = useAdminTable<PublicationRow>('publications', { orderBy: 'sort_order' })
const editing = ref<PublicationRow | null>(null)

onMounted(list)

async function submit() {
  if (!editing.value) return
  await save({ ...editing.value, url: editing.value.url || null })
  editing.value = null
  await list()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Publications & awards
        </h1>
        <p class="mt-1 text-sm text-muted">
          Grouped on the site by category.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="New entry"
        @click="editing = blank()"
      />
    </div>

    <ul class="mt-8 divide-y divide-default rounded-lg border border-default">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex items-center gap-4 p-3"
      >
        <UBadge
          :label="row.category"
          color="neutral"
          variant="subtle"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ row.title }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ row.detail }}
          </p>
        </div>
        <span class="shrink-0 text-xs text-dimmed">{{ row.published_on }}</span>
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Edit"
          @click="editing = { ...row }"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          aria-label="Delete"
          @click="row.id && window.confirm('Delete this entry?') && remove(row.id)"
        />
      </li>
    </ul>

    <UModal
      :open="Boolean(editing)"
      title="Publication"
      @update:open="value => !value && (editing = null)"
    >
      <template #body>
        <div
          v-if="editing"
          class="flex flex-col gap-4"
        >
          <UFormField label="Category">
            <USelect
              v-model="editing.category"
              :items="[...categories]"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Title">
            <UTextarea
              v-model="editing.title"
              :rows="2"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Detail"
            hint="authors, venue, or context"
          >
            <UTextarea
              v-model="editing.detail"
              :rows="2"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Date">
            <UInput
              v-model="editing.published_on"
              type="date"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Link">
            <UInput
              v-model="editing.url"
              placeholder="https://arxiv.org/abs/…"
              class="w-full"
            />
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
