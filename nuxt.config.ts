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

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: ''
    }
  },

  routeRules: {
    // The admin app is private: never rendered ahead of time, never indexed.
    '/admin/**': { ssr: false, robots: false, index: false },
    '/api/content/**': { cors: false },

    // Everything below reads from Supabase, so it must not be frozen at build
    // time. `isr` renders on demand and caches the result for a minute — new
    // and edited entries appear without a redeploy.
    '/': { isr: 60 },
    '/about': { isr: 60 },
    '/gallery': { isr: 60 },
    '/gallery/**': { isr: 60 },
    '/projects': { isr: 60 },
    '/blog': { isr: 60 },
    '/blog/**': { isr: 60 },
    '/publications': { isr: 60 },
    '/cv/**': { isr: 60 }
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
