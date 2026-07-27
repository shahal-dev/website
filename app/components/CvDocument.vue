<script setup lang="ts">
import type { CvCollectionItem } from '@nuxt/content'

const props = withDefaults(defineProps<{
  cv: CvCollectionItem
  /** `full` shows everything; `compact` keeps only entries flagged `compact: true`. */
  variant?: 'full' | 'compact'
  /** Print stylesheet + tighter type, used by the /cv/* routes. */
  print?: boolean
}>(), {
  variant: 'full',
  print: false
})

const compact = computed(() => props.variant === 'compact')

function pick<T extends { compact: boolean }>(items: T[] | undefined): T[] {
  if (!items) return []
  return compact.value ? items.filter(item => item.compact) : items
}

const education = computed(() => pick(props.cv.education))
const experience = computed(() => pick(props.cv.experience))
const publications = computed(() => pick(props.cv.publications))
const awards = computed(() => pick(props.cv.awards))
const projects = computed(() => pick(props.cv.projects))
const outreach = computed(() => pick(props.cv.outreach))
const skills = computed(() => pick(props.cv.skills))
const teaching = computed(() => pick(props.cv.teaching))

// In the one-page version only the first bullet of each entry survives.
function details(items: string[]) {
  return compact.value ? items.slice(0, 1) : items
}
</script>

<template>
  <article
    class="cv"
    :class="[
      print ? 'cv-print leading-snug' : 'text-sm',
      print && compact ? 'cv-tight text-[9pt]' : '',
      print && !compact ? 'text-[10.5pt]' : ''
    ]"
  >
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ cv.name }}
      </h1>
      <p class="mt-1 text-primary">
        {{ cv.role }}
      </p>
      <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>{{ cv.location }}</span>
        <span v-if="cv.phone">{{ cv.phone }}</span>
        <a :href="`mailto:${cv.email}`">{{ cv.email }}</a>
        <a
          v-for="link in cv.links"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener"
        >{{ link.label }}</a>
      </p>
      <p class="mt-3 text-pretty text-muted">
        {{ cv.summary }}
      </p>
    </header>

    <section
      v-if="skills.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Technical Skills
      </h2>
      <div
        v-for="group in skills"
        :key="group.group"
        class="cv-entry flex flex-wrap gap-x-2"
      >
        <span class="font-medium text-highlighted">{{ group.group }}:</span>
        <span class="text-muted">{{ group.items.join(' · ') }}</span>
      </div>
    </section>
    <section
      v-if="experience.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Experience
      </h2>
      <div
        v-for="item in experience"
        :key="item.organisation + item.role"
        class="cv-entry"
      >
        <div class="cv-entry-head">
          <h3 class="font-medium text-highlighted">
            {{ item.role }}
          </h3>
          <span class="cv-date">{{ item.date }}</span>
        </div>
        <p class="text-muted">
          {{ item.organisation }}
        </p>
        <ul class="cv-list">
          <li
            v-for="line in details(item.details)"
            :key="line"
          >
            {{ line }}
          </li>
        </ul>
      </div>
    </section>
    <section
      v-if="education.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Education
      </h2>
      <div
        v-for="item in education"
        :key="item.institution + item.degree"
        class="cv-entry"
      >
        <div class="cv-entry-head">
          <h3 class="font-medium text-highlighted">
            {{ item.institution }}
          </h3>
          <span class="cv-date">{{ item.date }}</span>
        </div>
        <p class="text-muted">
          {{ item.degree }}
        </p>
        <ul class="cv-list">
          <li
            v-for="line in details(item.details)"
            :key="line"
          >
            {{ line }}
          </li>
        </ul>
      </div>
    </section>
    <section
      v-if="publications.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Publications
      </h2>
      <div
        v-for="item in publications"
        :key="item.title"
        class="cv-entry"
      >
        <div class="cv-entry-head">
          <h3 class="font-medium text-balance text-highlighted">
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noopener"
            >{{ item.title }}</a>
            <template v-else>
              {{ item.title }}
            </template>
          </h3>
          <span class="cv-date">{{ item.date }}</span>
        </div>
        <p
          v-if="item.authors"
          class="text-muted"
        >
          {{ item.authors }}
        </p>
        <p class="text-dimmed">
          {{ item.venue }}
        </p>
      </div>
    </section>
    <section
      v-if="projects.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Selected Projects
      </h2>
      <div
        v-for="item in projects"
        :key="item.title"
        class="cv-entry"
      >
        <h3 class="font-medium text-highlighted">
          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener"
          >{{ item.title }}</a>
          <template v-else>
            {{ item.title }}
          </template>
        </h3>
        <p class="text-pretty text-muted">
          {{ item.detail }}
        </p>
      </div>
    </section>
    <section
      v-if="teaching.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Teaching
      </h2>
      <div
        v-for="item in teaching"
        :key="item.title"
        class="cv-entry"
      >
        <div class="cv-entry-head">
          <h3 class="font-medium text-highlighted">
            {{ item.title }}
          </h3>
          <span class="cv-date">{{ item.date }}</span>
        </div>
        <p class="text-muted">
          {{ item.detail }}
        </p>
      </div>
    </section>
    <section
      v-if="awards.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Awards & Honours
      </h2>
      <div
        v-for="item in awards"
        :key="item.title"
        class="cv-entry"
      >
        <div class="cv-entry-head">
          <h3 class="font-medium text-highlighted">
            {{ item.title }}
          </h3>
          <span class="cv-date">{{ item.date }}</span>
        </div>
        <p class="text-muted">
          {{ item.detail }}
        </p>
      </div>
    </section>
    <section
      v-if="outreach.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Outreach
      </h2>
      <div
        v-for="item in outreach"
        :key="item.title"
        class="cv-entry"
      >
        <h3 class="font-medium text-highlighted">
          {{ item.title }}
        </h3>
        <p class="text-muted">
          {{ item.detail }}
        </p>
      </div>
    </section>
    <section
      v-if="cv.languages?.length"
      class="cv-section"
    >
      <h2 class="cv-heading">
        Languages
      </h2>
      <p class="text-muted">
        {{ cv.languages.join(' · ') }}
      </p>
    </section>
  </article>
</template>

<style scoped>
.cv-section {
  margin-bottom: 1.25rem;
  break-inside: auto;
}

.cv-heading {
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-highlighted);
}

.cv-entry {
  margin-bottom: 0.75rem;
  break-inside: avoid;
}

.cv-entry:last-child {
  margin-bottom: 0;
}

.cv-entry-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 0.75rem;
}

.cv-date {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.cv-list {
  margin-top: 0.25rem;
  padding-left: 1rem;
  list-style: disc;
}

.cv-list li {
  color: var(--ui-text-muted);
  margin-bottom: 0.125rem;
}

.cv a {
  text-decoration: underline;
  text-decoration-color: var(--ui-border-accented);
  text-underline-offset: 2px;
}

/* One-page variant: tighter vertical rhythm. */
.cv-tight .cv-section {
  margin-bottom: 0.85rem;
}

.cv-tight .cv-entry {
  margin-bottom: 0.5rem;
}

.cv-tight header {
  margin-bottom: 1rem;
}

/* Print view: force light, page-sized, no link chrome. */
.cv-print {
  color: #111;
}

.cv-print :deep(a) {
  color: inherit;
}

@media print {
  .cv-print .cv-heading {
    border-color: #999;
  }
}
</style>
