<script setup lang="ts">
/** Drag-to-wipe comparison between my frame and a professional reference. */
const props = withDefaults(defineProps<{
  before: string
  after: string
  beforeAlt?: string
  afterAlt?: string
  beforeLabel?: string
  afterLabel?: string
}>(), {
  beforeAlt: '',
  afterAlt: '',
  beforeLabel: 'Mine',
  afterLabel: 'Reference'
})

const position = ref(50)
const root = useTemplateRef<HTMLElement>('root')
const dragging = ref(false)

function setFromClientX(clientX: number) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect || !rect.width) return
  position.value = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  setFromClientX(event.clientX)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  setFromClientX(event.clientX)
}

function onPointerUp() {
  dragging.value = false
}

function nudge(delta: number) {
  position.value = Math.min(100, Math.max(0, position.value + delta))
}
</script>

<template>
  <figure>
    <div
      ref="root"
      class="relative select-none overflow-hidden rounded-lg border border-default bg-elevated"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        :src="props.before"
        :alt="props.beforeAlt"
        class="block w-full"
        draggable="false"
      >

      <div
        class="absolute inset-0 overflow-hidden"
        :style="{ clipPath: `inset(0 0 0 ${position}%)` }"
      >
        <img
          :src="props.after"
          :alt="props.afterAlt"
          class="absolute inset-0 size-full object-cover"
          draggable="false"
        >
      </div>

      <span class="pointer-events-none absolute bottom-3 left-3 rounded bg-neutral-950/70 px-2 py-1 text-xs text-white">
        {{ props.beforeLabel }}
      </span>
      <span class="pointer-events-none absolute right-3 bottom-3 rounded bg-neutral-950/70 px-2 py-1 text-xs text-white">
        {{ props.afterLabel }}
      </span>

      <div
        class="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90"
        :style="{ left: `${position}%` }"
      />

      <button
        type="button"
        class="absolute top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg"
        :style="{ left: `${position}%` }"
        role="slider"
        aria-label="Compare images"
        :aria-valuenow="Math.round(position)"
        aria-valuemin="0"
        aria-valuemax="100"
        @keydown.left.prevent="nudge(-4)"
        @keydown.right.prevent="nudge(4)"
      >
        <UIcon
          name="i-lucide-chevrons-left-right"
          class="size-5"
        />
      </button>
    </div>
    <figcaption class="mt-2 text-xs text-dimmed">
      <slot name="caption" />
    </figcaption>
  </figure>
</template>
