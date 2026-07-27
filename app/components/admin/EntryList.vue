<script setup lang="ts">
/**
 * Editable list of records with a shared field shape — used for every CV
 * section (experience, education, publications, …) so they all behave the same.
 */
export interface FieldSpec {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'lines' | 'switch'
  placeholder?: string
  /** Full width in the two-column grid. */
  wide?: boolean
}

const props = defineProps<{
  title: string
  hint?: string
  fields: FieldSpec[]
  /** Field whose value labels a collapsed row. */
  labelKey: string
}>()

const model = defineModel<Record<string, unknown>[]>({ default: () => [] })

const open = ref<number | null>(null)

function add() {
  const blank: Record<string, unknown> = {}
  for (const field of props.fields) {
    blank[field.key] = field.type === 'switch' ? false : field.type === 'lines' ? [] : ''
  }
  model.value = [...model.value, blank]
  open.value = model.value.length - 1
}

function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
  open.value = null
}

function move(index: number, delta: number) {
  const next = [...model.value]
  const target = index + delta
  if (target < 0 || target >= next.length) return
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row!)
  model.value = next
  open.value = target
}

function linesValue(row: Record<string, unknown>, key: string) {
  const value = row[key]
  return Array.isArray(value) ? value.join('\n') : String(value || '')
}

function setLines(row: Record<string, unknown>, key: string, value: string) {
  row[key] = value.split('\n').map(line => line.trim()).filter(Boolean)
}
</script>

<template>
  <section class="rounded-lg border border-default">
    <header class="flex items-center justify-between gap-3 border-b border-default p-4">
      <div>
        <h2 class="font-medium text-highlighted">
          {{ title }}
        </h2>
        <p
          v-if="hint"
          class="text-xs text-dimmed"
        >
          {{ hint }}
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        label="Add"
        @click="add"
      />
    </header>

    <ul class="divide-y divide-default">
      <li
        v-for="(row, index) in model"
        :key="index"
        class="p-3"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="min-w-0 flex-1 text-left text-sm text-default"
            @click="open = open === index ? null : index"
          >
            <UIcon
              :name="open === index ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="mr-1 inline size-4 align-[-2px] text-muted"
            />
            {{ row[labelKey] || 'Untitled' }}
          </button>
          <UButton
            icon="i-lucide-chevron-up"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="index === 0"
            aria-label="Move up"
            @click="move(index, -1)"
          />
          <UButton
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="index === model.length - 1"
            aria-label="Move down"
            @click="move(index, 1)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Remove"
            @click="remove(index)"
          />
        </div>

        <div
          v-if="open === index"
          class="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <UFormField
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
            :class="field.wide || field.type === 'lines' || field.type === 'textarea' ? 'sm:col-span-2' : ''"
          >
            <USwitch
              v-if="field.type === 'switch'"
              :model-value="Boolean(row[field.key])"
              @update:model-value="row[field.key] = $event"
            />
            <UTextarea
              v-else-if="field.type === 'lines'"
              :model-value="linesValue(row, field.key)"
              :rows="4"
              :placeholder="field.placeholder || 'One per line'"
              class="w-full"
              @update:model-value="setLines(row, field.key, String($event))"
            />
            <UTextarea
              v-else-if="field.type === 'textarea'"
              :model-value="String(row[field.key] || '')"
              :rows="3"
              class="w-full"
              @update:model-value="row[field.key] = $event"
            />
            <UInput
              v-else
              :model-value="String(row[field.key] || '')"
              :placeholder="field.placeholder"
              class="w-full"
              @update:model-value="row[field.key] = $event"
            />
          </UFormField>
        </div>
      </li>
    </ul>

    <p
      v-if="!model.length"
      class="p-4 text-sm text-muted"
    >
      Nothing here yet.
    </p>
  </section>
</template>
