<script setup lang="ts">
interface Photo {
  src: string
  alt: string
  title: string
  tag?: string
  caption?: string
  date?: string
  /** Detail page for this photo. */
  to?: string
  shopTo?: string
}

const props = defineProps<{
  photos: Photo[]
}>()

const active = ref(0)

// Photos reordered so the active one comes first, the rest trail behind it as cards.
const ordered = computed(() => props.photos.map((_, i) => props.photos[(active.value + i) % props.photos.length]!))

function next() {
  active.value = (active.value + 1) % props.photos.length
}

function prev() {
  active.value = (active.value - 1 + props.photos.length) % props.photos.length
}
</script>

<template>
  <div
    class="gallery-slider relative w-full overflow-hidden rounded-xl border border-default bg-elevated"
    role="region"
    aria-roledescription="carousel"
    aria-label="Astrophotography gallery"
    tabindex="0"
    @keydown.left.prevent="prev"
    @keydown.right.prevent="next"
  >
    <component
      :is="index === 0 ? 'div' : 'button'"
      v-for="(photo, index) in ordered"
      :key="photo.src"
      class="gallery-item absolute overflow-hidden text-left"
      :class="index === 0 ? 'z-0' : 'z-10 rounded-lg shadow-xl shadow-neutral-950/40 cursor-pointer'"
      :style="index === 0
        ? { left: '0px', top: '0px', width: '100%', height: '100%' }
        : { left: `calc(100% - 1.65 * var(--card-w) + ${(index - 1) * 1.15} * var(--card-w))`, top: `calc(50% - var(--card-h) / 2)`, width: 'var(--card-w)', height: 'var(--card-h)' }"
      :aria-hidden="index !== 0"
      :aria-label="index === 0 ? undefined : `Show ${photo.title}`"
      :tabindex="index === 0 ? undefined : -1"
      @click="index !== 0 && (active = (active + index) % photos.length)"
    >
      <img
        :src="photo.src"
        :alt="index === 0 ? photo.alt : ''"
        class="size-full object-cover"
        loading="lazy"
      >
      <div
        v-if="index === 0"
        class="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-transparent"
      />

      <div
        v-if="index === 0"
        class="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-2 p-6 text-white sm:max-w-md sm:p-10"
      >
        <p class="text-xs uppercase tracking-[0.2em] text-white/70">
          {{ photo.tag }}<template v-if="photo.date">
            · {{ photo.date }}
          </template>
        </p>
        <h3 class="text-2xl sm:text-4xl font-semibold text-balance">
          {{ photo.title }}
        </h3>
        <p
          v-if="photo.caption"
          class="text-sm text-white/80 text-pretty"
        >
          {{ photo.caption }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <NuxtLink
            v-if="photo.shopTo"
            :to="photo.shopTo"
            class="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 transition hover:bg-white/85"
          >
            Order print
            <UIcon
              name="i-lucide-shopping-bag"
              class="size-4"
            />
          </NuxtLink>
          <NuxtLink
            v-if="photo.to"
            :to="photo.to"
            class="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/20"
          >
            See the story
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </div>
    </component>

    <div class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-6 sm:left-6 sm:translate-x-0">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="solid"
        size="sm"
        aria-label="Previous photo"
        @click="prev"
      />
      <UButton
        icon="i-lucide-arrow-right"
        color="neutral"
        variant="solid"
        size="sm"
        aria-label="Next photo"
        @click="next"
      />
      <span class="ml-2 text-xs text-white/70 tabular-nums">
        {{ active + 1 }} / {{ photos.length }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.gallery-slider {
  --card-w: 5.5rem;
  --card-h: 8rem;
  height: 20rem;
}

@media (min-width: 640px) {
  .gallery-slider {
    --card-w: 9rem;
    --card-h: 13rem;
    height: 30rem;
  }
}

.gallery-item {
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.6s cubic-bezier(0.4, 0, 0.2, 1), height 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.6s;
}
</style>
