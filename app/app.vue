<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const { public: config } = useRuntimeConfig()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')
const siteUrl = String(config.siteUrl || '').replace(/\/$/, '')
const canonical = computed(() => `${siteUrl}${route.path === '/' ? '' : route.path}`)

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
    { name: 'author', content: 'MD Shahadat Hossain Shahal' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'canonical', href: canonical },
    { rel: 'alternate', type: 'application/rss+xml', title: 'Writing — MD Shahadat Hossain Shahal', href: '/rss.xml' }
  ],
  htmlAttrs: {
    lang: 'en'
  },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'MD Shahadat Hossain Shahal',
        'url': siteUrl,
        'inLanguage': 'en',
        'author': { '@type': 'Person', 'name': 'MD Shahadat Hossain Shahal' }
      })
    }
  ]
})

useSeoMeta({
  titleTemplate: '%s - MD Shahadat Hossain Shahal',
  twitterCard: 'summary_large_image',
  ogSiteName: 'MD Shahadat Hossain Shahal',
  ogType: 'website',
  ogLocale: 'en_US',
  ogUrl: canonical,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation('blog')
    ])
  }, {
    transform: data => data.flat()
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections('blog')
    ])
  }, {
    server: false,
    transform: data => data.flat()
  })
])
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UMain class="relative">
        <NuxtPage />
      </UMain>
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
