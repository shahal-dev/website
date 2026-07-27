<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Gallery — Admin', robots: 'noindex, nofollow' })

interface PhotoRow {
  id: string
  slug: string
  title: string
  tag?: string
  thumb_url: string
  published: boolean
  featured: boolean
  sort_order: number
}

const { rows, pending, list, remove, save } = useAdminTable<PhotoRow>('gallery_photos', { orderBy: 'sort_order' })

onMounted(list)

async function togglePublished(row: PhotoRow) {
  await save({ id: row.id, published: !row.published } as Partial<PhotoRow> & { id: string })
  row.published = !row.published
}

async function move(row: PhotoRow, delta: number) {
  const index = rows.value.findIndex(item => item.id === row.id)
  const swap = rows.value[index + delta]
  if (!swap) return
  const a = row.sort_order
  const b = swap.sort_order
  await save({ id: row.id, sort_order: b } as Partial<PhotoRow> & { id: string })
  await save({ id: swap.id, sort_order: a } as Partial<PhotoRow> & { id: string })
  await list()
}

async function confirmDelete(row: PhotoRow) {
  if (!window.confirm(`Delete “${row.title}”? The uploaded image files stay in storage.`)) return
  await remove(row.id)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Gallery
        </h1>
        <p class="mt-1 text-sm text-muted">
          Order here is the order on the site.
        </p>
      </div>
      <UButton
        to="/admin/gallery/new"
        icon="i-lucide-plus"
        label="New photo"
      />
    </div>

    <div
      v-if="pending && !rows.length"
      class="mt-8 text-sm text-muted"
    >
      Loading…
    </div>

    <p
      v-else-if="!rows.length"
      class="mt-8 text-sm text-muted"
    >
      Nothing here yet. Upload your first photo.
    </p>

    <ul
      v-else
      class="mt-8 divide-y divide-default rounded-lg border border-default"
    >
      <li
        v-for="(row, index) in rows"
        :key="row.id"
        class="flex items-center gap-4 p-3"
      >
        <img
          :src="row.thumb_url"
          :alt="row.title"
          class="size-14 shrink-0 rounded object-cover"
        >

        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ row.title }}
          </p>
          <p class="truncate text-xs text-muted">
            /gallery/{{ row.slug }}<span v-if="row.tag"> · {{ row.tag }}</span>
          </p>
        </div>

        <UBadge
          v-if="row.featured"
          color="neutral"
          variant="subtle"
          size="sm"
          label="Featured"
        />
        <UBadge
          :color="row.published ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
          :label="row.published ? 'Live' : 'Draft'"
          class="cursor-pointer"
          @click="togglePublished(row)"
        />

        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-chevron-up"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="index === 0"
            aria-label="Move up"
            @click="move(row, -1)"
          />
          <UButton
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="index === rows.length - 1"
            aria-label="Move down"
            @click="move(row, 1)"
          />
          <UButton
            :to="`/admin/gallery/${row.id}`"
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Edit"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Delete"
            @click="confirmDelete(row)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
