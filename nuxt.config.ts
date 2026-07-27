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

  app: {
    head: {
      meta: [
        // Proves ownership to Google Search Console. The previous site's
        // token went away with its deployment, leaving the property verified
        // only by Google's cached grant — which is revoked on re-check.
        { name: 'google-site-verification', content: 'zDi2OFFJW4nJeSjniuk0AXS-_fy9UbNXFo4K4zQHGAI' }
      ]
    }
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://knowshahal.vercel.app',
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://knowshahal.vercel.app'
    }
  },

  routeRules: {
    // The admin app is private: never rendered ahead of time, never indexed.
    '/admin/**': { ssr: false, robots: false, index: false },
    '/api/content/**': { cors: false },

    // Everything below reads from Supabase, so it must not be frozen at build
    // time. `isr` renders on demand and caches the result — new and edited
    // entries appear without a redeploy. Kept long (1h) because a short
    // window meant almost every visitor hit a cold serverless render;
    // edits still show up within the hour without a redeploy.
    '/': { isr: 3600 },
    '/about': { isr: 3600 },
    '/gallery': { isr: 3600 },
    '/gallery/**': { isr: 3600 },
    '/projects': { isr: 3600 },
    '/blog': { isr: 3600 },
    '/blog/**': { isr: 3600 },
    '/publications': { isr: 3600 },
    '/cv/**': { isr: 3600 }
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
