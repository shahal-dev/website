<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const props = defineProps<{
  links: NavigationMenuItem[]
}>()

const route = useRoute()
const open = ref(false)

// Close the menu after navigating.
watch(() => route.path, () => {
  open.value = false
})

const currentLabel = computed(() => {
  const match = props.links.find(link => link.to === route.path)
    || props.links.find(link => link.to !== '/' && route.path.startsWith(String(link.to)))
  return match?.label || 'Menu'
})
</script>

<template>
  <div class="fixed inset-x-0 top-2 z-10 flex justify-center px-3 sm:top-4">
    <!-- Phones: a compact bar that opens the full list. -->
    <div class="flex w-full max-w-sm items-center gap-1 rounded-full border border-muted/50 bg-muted/80 px-2 py-1 shadow-lg shadow-neutral-950/5 backdrop-blur-sm sm:hidden">
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-expanded="open"
        aria-label="Open menu"
        @click="open = true"
      />
      <span class="min-w-0 flex-1 truncate text-sm font-medium text-default">
        {{ currentLabel }}
      </span>
      <ColorModeButton />
    </div>

    <!-- Tablets and up: the full pill. -->
    <UNavigationMenu
      :items="links"
      variant="link"
      color="neutral"
      class="hidden rounded-full border border-muted/50 bg-muted/80 px-2 shadow-lg shadow-neutral-950/5 backdrop-blur-sm sm:flex sm:px-4"
      :ui="{
        link: 'px-2 py-1',
        linkLeadingIcon: 'hidden'
      }"
    >
      <template #list-trailing>
        <ColorModeButton />
      </template>
    </UNavigationMenu>

    <USlideover
      v-model:open="open"
      side="left"
      title="Menu"
      :ui="{ content: 'max-w-72' }"
    >
      <template #body>
        <nav class="flex flex-col gap-1">
          <UButton
            v-for="link in links"
            :key="String(link.to)"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            :variant="route.path === link.to ? 'soft' : 'ghost'"
            color="neutral"
            size="lg"
            class="justify-start"
          />
        </nav>
      </template>
    </USlideover>
  </div>
</template>
