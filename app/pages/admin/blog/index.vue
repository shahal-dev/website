<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Blog — Admin', robots: 'noindex, nofollow' })

interface PostRow {
  id: string
  slug: string
  title: string
  published_on: string
  published: boolean
  image_url: string | null
}

const { rows, list, remove } = useAdminTable<PostRow>('posts', { orderBy: 'published_on', ascending: false })

onMounted(list)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-highlighted">
        Blog
      </h1>
      <UButton
        to="/admin/blog/new"
        icon="i-lucide-plus"
        label="New post"
      />
    </div>

    <p
      v-if="!rows.length"
      class="mt-8 text-sm text-muted"
    >
      No posts yet.
    </p>

    <ul
      v-else
      class="mt-8 divide-y divide-default rounded-lg border border-default"
    >
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
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ row.title }}
          </p>
          <p class="text-xs text-muted">
            {{ row.published_on }} · /blog/{{ row.slug }}
          </p>
        </div>
        <UBadge
          :color="row.published ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
          :label="row.published ? 'Live' : 'Draft'"
        />
        <UButton
          :to="`/admin/blog/${row.id}`"
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
          @click="window.confirm(`Delete “${row.title}”?`) && remove(row.id)"
        />
      </li>
    </ul>
  </div>
</template>
