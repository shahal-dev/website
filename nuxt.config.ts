// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://shahadathshahal.vercel.app',
    name: 'MD Shahadat Hossain Shahal'
  },

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://shahadathshahal.vercel.app'
    }
  },

  routeRules: {
    // The admin app is private: never rendered ahead of time, never indexed.
    '/admin/**': { ssr: false, robots: false, index: false },
    '/api/content/**': { cors: false },

    // Everything below reads from Supabase, so it must not be frozen at build
    // time. `isr` renders on demand and caches the result briefly — new and
    // edited entries appear without a redeploy.
    '/': { isr: 30 },
    '/about': { isr: 30 },
    '/gallery': { isr: 30 },
    '/gallery/**': { isr: 30 },
    '/projects': { isr: 30 },
    '/blog': { isr: 30 },
    '/blog/**': { isr: 30 },
    '/publications': { isr: 30 },
    '/cv/**': { isr: 30 }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      // Nothing is prerendered: every page depends on database content.
      crawlLinks: false,
      ignore: ['/admin']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  ogImage: {
    // Pages are no longer prerendered, so OG images are generated on demand.
    zeroRuntime: false
  }
})
