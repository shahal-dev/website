<script setup lang="ts">
definePageMeta({
  layout: false,
  validate: route => ['compact', 'full'].includes(String(route.params.variant))
})

const route = useRoute()
const variant = computed(() => (route.params.variant === 'compact' ? 'compact' : 'full'))

const cv = await useContentItem<Record<string, unknown>>('cv-document-print', 'cv')
if (!cv.value) {
  throw createError({ statusCode: 404, statusMessage: 'CV not found', fatal: true })
}

const label = computed(() => variant.value === 'compact' ? 'One-page CV' : 'Full résumé')

useSeoMeta({
  title: `${cv.value.name} — ${label.value}`,
  robots: 'noindex'
})

// Opening the page with ?print=1 (what the About page buttons do) goes straight
// to the browser's print dialog, where "Save as PDF" produces the download.
onMounted(() => {
  if (route.query.print !== undefined) {
    setTimeout(() => window.print(), 400)
  }
})
</script>

<template>
  <div class="cv-page">
    <div class="cv-toolbar">
      <NuxtLink
        to="/about"
        class="cv-toolbar-link"
      >
        ← Back to about
      </NuxtLink>
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/cv/${variant === 'compact' ? 'full' : 'compact'}`"
          class="cv-toolbar-link"
        >
          {{ variant === 'compact' ? 'Full résumé' : 'One-page CV' }}
        </NuxtLink>
        <button
          type="button"
          class="cv-toolbar-button"
          @click="() => window.print()"
        >
          Save as PDF
        </button>
      </div>
    </div>

    <main class="cv-sheet">
      <CvDocument
        v-if="cv"
        :cv="cv"
        :variant="variant"
        print
      />
    </main>
  </div>
</template>

<style scoped>
.cv-page {
  /* Force a light, print-safe palette regardless of the site's colour mode. */
  --ui-bg: #ffffff;
  --ui-text: #1f2328;
  --ui-text-highlighted: #000000;
  --ui-text-muted: #33383d;
  --ui-text-dimmed: #5a6067;
  --ui-border: #d4d7db;
  --ui-border-accented: #9aa0a6;
  --ui-primary: #3b4cc0;

  min-height: 100vh;
  background: #f3f4f6;
  color: var(--ui-text);
  color-scheme: light;
}

.cv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 21cm;
  margin: 0 auto;
  padding: 1rem 0.5rem;
  font-size: 0.875rem;
}

.cv-toolbar-link {
  color: #33383d;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cv-toolbar-button {
  border: 1px solid #d4d7db;
  border-radius: 0.375rem;
  background: #ffffff;
  padding: 0.35rem 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.cv-sheet {
  box-sizing: border-box;
  width: 100%;
  max-width: 21cm;
  margin: 0 auto 3rem;
  background: #ffffff;
  padding: 1.6cm 1.5cm;
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%), 0 8px 24px rgb(0 0 0 / 8%);
}

@page {
  size: A4;
  margin: 1.25cm;
}

@media print {
  .cv-page {
    width: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    background: #ffffff;
    print-color-adjust: exact;
  }

  /* Scale the one-pager to fit while compensating its layout width. Without
     the expanded width, CSS zoom leaves a visibly oversized right margin. */
  .cv-sheet :deep(.cv-tight) {
    zoom: 0.83;
    width: calc(100% / 0.83);
  }

  .cv-toolbar {
    display: none;
  }

  .cv-sheet {
    width: auto;
    max-width: none;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }
}
</style>
