<script setup lang="ts">
const { data: page } = await useAsyncData('projects-page', () => {
  return queryCollection('pages').path('/projects').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

interface ProjectItem {
  slug?: string
  title: string
  description: string
  supervisor?: string
  items?: Array<{ title: string, description: string }>
  image?: string
  url?: string
  tags?: string[]
  date?: string
}

// Project files are canonical so repository edits are not shadowed by an
// older Supabase import.
const { data: projectData } = await useAsyncData('project-file-items', () => {
  return queryCollection('projects').all()
})
const projects = computed<ProjectItem[]>(() => projectData.value || [])

const { global } = useAppConfig()

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Portfolio', { title, description })

const url = useSiteUrl()

useJsonLd(() => ({
  '@type': 'CollectionPage',
  'name': title,
  'description': description,
  'url': url('/projects'),
  'mainEntity': {
    '@type': 'ItemList',
    'itemListElement': projects.value.map((project, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': project.title,
      'description': project.description,
      ...(project.url ? { url: project.url } : {})
    }))
  }
}))
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.links"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <template #links>
        <div
          v-if="page.links"
          class="flex items-center gap-2"
        >
          <UButton
            :label="page.links[0]?.label"
            :to="global.meetingLink"
            v-bind="page.links[0]"
          />
          <UButton
            to="https://github.com/shahal-dev"
            target="_blank"
            v-bind="page.links[1]"
          />
        </div>
      </template>
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <Motion
        v-for="(project, index) in projects"
        :key="project.title"
        :initial="{ opacity: 0, transform: 'translateY(10px)' }"
        :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.2 * index }"
        :in-view-options="{ once: true }"
      >
        <UPageCard
          :title="project.title"
          :to="project.url"
          orientation="horizontal"
          variant="naked"
          :reverse="index % 2 === 1"
          class="group"
          :ui="{
            wrapper: 'max-sm:order-last'
          }"
        >
          <template #description>
            <div class="space-y-3 text-sm text-muted">
              <p
                v-if="project.supervisor"
                class="font-medium text-highlighted"
              >
                <span class="text-muted">Supervisor:</span> {{ project.supervisor }}
              </p>
              <ol
                v-if="project.items?.length"
                class="list-decimal space-y-2 pl-5"
              >
                <li
                  v-for="item in project.items"
                  :key="item.title"
                  class="pl-1"
                >
                  <span class="font-medium text-highlighted">{{ item.title }}:</span>
                  {{ item.description }}
                </li>
              </ol>
              <p v-else>
                {{ project.description }}
              </p>
            </div>
          </template>
          <template #leading>
            <span class="text-sm text-muted">
              {{ String(project.date || '').slice(0, 4) }}
            </span>
          </template>
          <template
            v-if="project.url"
            #footer
          >
            <ULink
              :to="project.url"
              class="text-sm text-primary flex items-center"
            >
              View Project
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
              />
            </ULink>
          </template>
          <img
            v-if="project.image"
            :src="project.image"
            :alt="project.title"
            class="object-cover w-full h-48 rounded-lg"
          >
          <div
            v-else
            class="flex h-48 w-full items-center justify-center rounded-lg border border-default bg-elevated/50"
          >
            <UIcon
              name="i-lucide-code-xml"
              class="size-8 text-muted"
            />
          </div>
        </UPageCard>
      </Motion>
    </UPageSection>
  </UPage>
</template>
