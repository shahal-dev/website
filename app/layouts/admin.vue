<script setup lang="ts">
const route = useRoute()
const configured = isSupabaseConfigured()
// This layout also renders the "not connected yet" screen, so it has to
// survive missing credentials.
const auth = configured ? useAdminAuth() : null

const links = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Gallery', icon: 'i-lucide-camera', to: '/admin/gallery' },
  { label: 'Orders', icon: 'i-lucide-shopping-bag', to: '/admin/orders' },
  { label: 'Projects', icon: 'i-lucide-folder', to: '/admin/projects' },
  { label: 'Blog', icon: 'i-lucide-file-text', to: '/admin/blog' },
  { label: 'Publications', icon: 'i-lucide-graduation-cap', to: '/admin/publications' },
  { label: 'CV', icon: 'i-lucide-file-user', to: '/admin/cv' },
  { label: 'Pages', icon: 'i-lucide-file-pen-line', to: '/admin/pages' },
  { label: 'Import', icon: 'i-lucide-download', to: '/admin/import' }
]

const isLogin = computed(() => route.path === '/admin/login')
</script>

<template>
  <div class="min-h-screen bg-default">
    <header
      v-if="!isLogin && configured"
      class="border-b border-default"
    >
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <NuxtLink
          to="/admin"
          class="font-medium text-highlighted"
        >
          Admin
        </NuxtLink>

        <nav class="flex flex-wrap items-center gap-1">
          <UButton
            v-for="link in links"
            :key="link.to"
            v-bind="link"
            :variant="route.path === link.to ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
          />
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <UButton
            to="/"
            target="_blank"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            size="sm"
            label="View site"
          />
          <span class="hidden text-xs text-muted sm:inline">{{ auth?.user.value?.email }}</span>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Sign out"
            @click="auth?.signOut()"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
