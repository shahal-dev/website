<script setup lang="ts">
const { isCartOpen, hydrate } = usePrintCart()
onMounted(hydrate)
</script>

<template>
  <div class="dark flex min-h-screen flex-col bg-[#020420] text-white">
    <ShopNavbar />
    <div class="flex-1">
      <slot />
    </div>
    <ShopFooter />
    <USlideover
      v-model:open="isCartOpen"
      title="Your order"
      description="Review your images before checkout"
    >
      <template #body>
        <ShopOrderSummary />
      </template>
    </USlideover>
  </div>
</template>
