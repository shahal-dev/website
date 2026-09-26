<script setup lang="ts">
const { count, isCartOpen } = usePrintCart()
const menuOpen = ref(false)
const links = [
  { label: 'All images', to: '/shop/collection/all' },
  { label: 'About', to: '/shop/about' },
  { label: 'Portfolio', to: '/' }
]
</script>

<template>
  <header class="border-b border-slate-800/80 bg-[#020420]/95 sticky top-0 z-30 backdrop-blur">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
      <NuxtLink
        to="/shop"
        class="block w-36 max-w-[42vw] shrink-0 text-white transition-colors hover:text-emerald-300"
        aria-label="Shahal print shop home"
      >
        <ShopSignature class="h-auto w-full" />
      </NuxtLink>
      <nav
        aria-label="Main navigation"
        class="hidden sm:flex gap-7 ml-auto text-sm text-slate-300"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="hover:text-white transition"
        >{{ link.label }}</NuxtLink>
      </nav>
      <button
        class="sm:hidden ml-auto text-sm"
        type="button"
        @click="menuOpen = !menuOpen"
      >
        Menu
      </button>
      <button
        class="relative rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-emerald-400 transition"
        type="button"
        :aria-label="`Open order, ${count} items`"
        @click="isCartOpen = true"
      >
        Order <span class="text-emerald-400 ml-1">{{ count }}</span>
      </button>
    </div>
    <nav
      v-if="menuOpen"
      aria-label="Mobile navigation"
      class="sm:hidden px-6 pb-4 flex gap-6 text-sm text-slate-300"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        @click="menuOpen = false"
      >{{ link.label }}</NuxtLink>
    </nav>
  </header>
</template>
