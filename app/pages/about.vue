<script setup lang="ts">
const { data: page } = await useAsyncData('about', () => {
  return queryCollection('about').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const cv = await useContentItem<Record<string, unknown>>('cv-document', 'cv')

// Database copy wins over the checked-in file when the About page has been
// edited in the admin.
const copy = await usePageCopy('about', {
  title: page.value?.title,
  description: page.value?.description,
  body: String(page.value?.content || '')
})

const { global } = useAppConfig()

const title = page.value?.seo?.title || copy.value.title
const description = page.value?.seo?.description || copy.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Portfolio', { title, description })

const url = useSiteUrl()
const { footer } = useAppConfig()

useJsonLd(() => ({
  '@type': 'Person',
  'name': 'MD Shahadat Hossain Shahal',
  'jobTitle': cv.value?.role || 'Research Assistant — Radio Astronomy & Machine Learning',
  'description': description,
  'url': url('/about'),
  'image': url('/portrait.jpg'),
  'email': `mailto:${global.email}`,
  'sameAs': (footer?.links || []).map(link => link.to).filter(Boolean),
  'worksFor': {
    '@type': 'Organization',
    'name': 'Center for Astronomy, Space Science and Astrophysics (CASSA), Independent University, Bangladesh',
    'url': 'https://www.iub.edu.bd/'
  },
  'alumniOf': {
    '@type': 'CollegeOrUniversity',
    'name': 'Independent University, Bangladesh'
  },
  'knowsAbout': ['Radio astronomy', 'Machine learning', 'Astrophotography', 'Deep learning', 'X-ray astronomy']
}))
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="copy.title"
      :description="copy.description"
      orientation="horizontal"
      :ui="{
        container: 'lg:flex sm:flex-row items-center',
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <UColorModeAvatar
        class="sm:rotate-4 size-36 rounded-lg ring ring-default ring-offset-3 ring-offset-bg"
        :light="global.picture?.light!"
        :dark="global.picture?.dark!"
        :alt="global.picture?.alt!"
      />
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <MDC
        :value="copy.body"
        class="prose prose-sm dark:prose-invert max-w-none text-muted"
      />

      <div
        v-if="cv"
        class="mt-10 border-t border-default pt-10"
      >
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-medium text-highlighted lg:text-2xl">
              Curriculum Vitae
            </h2>
            <p class="mt-1 text-sm text-muted">
              The full record — education, research, publications, awards, and projects.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              to="/cv/compact?print"
              target="_blank"
              icon="i-lucide-file-text"
              color="neutral"
              label="One-page CV"
            />
            <UButton
              to="/cv/full?print"
              target="_blank"
              icon="i-lucide-download"
              color="neutral"
              variant="subtle"
              label="Full résumé"
            />
          </div>
        </div>

        <CvDocument :cv="cv" />
      </div>

      <div class="flex flex-row justify-center items-center py-10 -space-x-8">
        <PolaroidItem
          v-for="(image, index) in page.images"
          :key="index"
          :image="image"
          :index
        />
      </div>
    </UPageSection>
  </UPage>
</template>
