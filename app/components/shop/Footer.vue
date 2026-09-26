<template>
  <footer class="border-t border-slate-800 mt-20">
    <div class="max-w-7xl mx-auto px-6 py-12 grid gap-8 sm:grid-cols-3 text-sm text-slate-400">
      <div>
        <ShopSignature class="h-auto w-36 max-w-full text-white" />
        <p class="mt-3 max-w-xs">
          Astrophotography prints made for spaces that deserve a wider view.
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <NuxtLink
          to="/"
          class="hover:text-white"
        >Portfolio</NuxtLink>
        <NuxtLink
          to="/shop/collection/all"
          class="hover:text-white"
        >Explore images</NuxtLink>
        <NuxtLink
          to="/shop/about"
          class="hover:text-white"
        >How ordering works</NuxtLink>
        <NuxtLink
          to="/shop/checkout"
          class="hover:text-white"
        >Your order</NuxtLink>
      </div>
      <div class="sm:text-right">
        <p>Payment is verified by transaction ID. Shipping is arranged personally.</p>
        <a
          href="mailto:shahadatw6@gmail.com"
          class="inline-block mt-3 text-emerald-400 hover:underline"
        >Contact Shahal</a>
      </div>
    </div>
  </footer>
</template>
