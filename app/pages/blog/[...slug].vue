<script setup lang="ts">
const route = useRoute()

const slug = computed(() => route.path.split('/').filter(Boolean).pop())

const { data: page } = await useAsyncData(route.path, async () => {
  const remote = await $fetch<{ source: string, item: Record<string, unknown> | null }>(
    `/api/content/posts/${slug.value}`
  ).catch(() => null)
  return (remote?.item as Record<string, unknown>) || null
})
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const { data: surround } = await useAsyncData(`${route.path}-surround`, async () => {
  const list = await $fetch<{ items: Array<{ path: string, title: string, description: string }> }>(
    '/api/content/posts'
  ).catch(() => null)
  const items = list?.items || []
  const index = items.findIndex(item => item.path === route.path)
  return index === -1 ? [] : [items[index - 1] || null, items[index + 1] || null]
})

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  ogType: 'article'
})

if (page.value.image) {
  useSeoMeta({ ogImage: page.value.image })
} else {
  defineOgImage('Portfolio', {
    title,
    description,
    headline: 'Blog'
  })
}

const url = useSiteUrl()

useJsonLd(() => ({
  '@type': 'BlogPosting',
  'headline': page.value?.title,
  'description': page.value?.description,
  'url': url(route.path),
  'mainEntityOfPage': url(route.path),
  ...(page.value?.image ? { image: url(String(page.value.image)) } : {}),
  ...(page.value?.date ? { datePublished: String(page.value.date).slice(0, 10) } : {}),
  'author': { '@type': 'Person', 'name': 'MD Shahadat Hossain Shahal', 'url': url('/about') },
  'publisher': { '@type': 'Person', 'name': 'MD Shahadat Hossain Shahal' }
}))

const articleLink = computed(() => `${window?.location}`)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UMain class="mt-20 px-2">
    <UContainer class="relative min-h-screen">
      <UPage v-if="page">
        <ULink
          to="/blog"
          class="text-sm flex items-center gap-1"
        >
          <UIcon name="lucide:chevron-left" />
          Blog
        </ULink>
        <div class="flex flex-col gap-3 mt-8">
          <div class="flex text-xs text-muted items-center justify-center gap-2">
            <span v-if="page.date">
              {{ formatDate(page.date) }}
            </span>
            <span v-if="page.date && page.minRead">
              -
            </span>
            <span v-if="page.minRead">
              {{ page.minRead }} MIN READ
            </span>
          </div>
          <NuxtImg
            v-if="page.image"
            :src="page.image"
            :alt="page.title"
            class="rounded-lg w-full h-[300px] object-cover object-center"
          />
          <h1 class="text-4xl text-center font-medium max-w-3xl mx-auto mt-4">
            {{ page.title }}
          </h1>
          <p class="text-muted text-center max-w-2xl mx-auto">
            {{ page.description }}
          </p>
          <div class="flex items-center justify-center gap-2 mt-2">
            <UUser
              orientation="vertical"
              color="neutral"
              variant="outline"
              class="justify-center items-center text-center"
              v-bind="page.author"
            />
          </div>
        </div>
        <UPageBody class="max-w-3xl mx-auto">
          <MDC
            v-if="typeof page.body === 'string'"
            :value="page.body"
          />

          <div class="flex items-center justify-end gap-2 text-sm text-muted">
            <UButton
              size="sm"
              variant="link"
              color="neutral"
              label="Copy link"
              @click="copyToClipboard(articleLink, 'Article link copied to clipboard')"
            />
          </div>
          <UContentSurround :surround />
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>
