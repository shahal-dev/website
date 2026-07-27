<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.about.title"
    :ui="{
      container: 'p-0!',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'text-left mt-3'
    }"
  >
    <template #description>
      <MDC
        :value="page.about.description"
        class="prose prose-sm dark:prose-invert max-w-none text-sm text-muted [&_p]:mt-0 [&_p]:mb-3 [&_p:last-child]:mb-0"
      />
    </template>
  </UPageSection>
</template>

<style scoped>

</style>
