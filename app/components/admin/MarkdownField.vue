<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(defineProps<{
  label?: string
  hint?: string
  rows?: number
}>(), {
  label: 'Body',
  hint: 'Markdown — headings, **bold**, lists, [links](/), ![images](url), and MDC blocks.',
  rows: 16
})

const preview = ref(false)
</script>

<template>
  <div>
    <div class="mb-1 flex items-center justify-between gap-3">
      <label class="block text-sm font-medium text-default">{{ label }}</label>
      <UButton
        :icon="preview ? 'i-lucide-pencil' : 'i-lucide-eye'"
        :label="preview ? 'Write' : 'Preview'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="preview = !preview"
      />
    </div>

    <UTextarea
      v-if="!preview"
      v-model="model"
      :rows="rows"
      class="w-full font-mono"
      :ui="{ base: 'font-mono text-sm' }"
    />

    <div
      v-else
      class="prose prose-sm dark:prose-invert min-h-40 max-w-none rounded-lg border border-default bg-elevated/30 p-4"
    >
      <MDC :value="model || '_Nothing yet._'" />
    </div>

    <p class="mt-1 text-xs text-dimmed">
      {{ hint }}
    </p>
  </div>
</template>
