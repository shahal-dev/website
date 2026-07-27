<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => {
  return queryCollection('index').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const url = useSiteUrl()

useJsonLd(() => ({
  '@type': 'WebPage',
  'name': page.value?.title,
  'description': page.value?.description,
  'url': url('/'),
  'publisher': {
    '@type': 'Person',
    'name': 'MD Shahadat Hossain Shahal',
    'image': { '@type': 'ImageObject', 'url': url('/avatar.jpg') }
  }
}))

useSeoMeta({
  title: page.value?.seo.title || page.value?.title,
  ogTitle: page.value?.seo.title || page.value?.title,
  description: page.value?.seo.description || page.value?.description,
  ogDescription: page.value?.seo.description || page.value?.description
})
</script>

<template>
  <UPage v-if="page">
    <LandingHero :page />
    <UPageSection
      :ui="{
        container: 'pt-0! lg:grid lg:grid-cols-2 lg:gap-8'
      }"
    >
      <LandingAbout :page />
      <LandingWorkExperience :page />
    </UPageSection>
    <LandingBlog :page />
    <LandingFAQ :page />
  </UPage>
</template>
