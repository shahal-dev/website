<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useSeoMeta({ title: 'Admin', robots: 'noindex, nofollow' })

const configured = isSupabaseConfigured()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

// Small client-side backoff on repeated failures. Supabase rate-limits auth
// server-side too; this just makes brute-forcing the form pointless.
const attempts = ref(0)
const lockedUntil = ref(0)
const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 500)
const lockedFor = computed(() => Math.max(0, Math.ceil((lockedUntil.value - now.value) / 1000)))

onMounted(async () => {
  if (!configured) return
  const auth = useAdminAuth()
  await auth.init()
  if (auth.session.value && auth.isAdmin.value) {
    await navigateTo(String(route.query.redirect || '/admin'))
  }
})

async function submit() {
  if (lockedFor.value > 0) return
  error.value = ''
  pending.value = true
  try {
    await useAdminAuth().signIn(email.value.trim(), password.value)
    attempts.value = 0
    await navigateTo(String(route.query.redirect || '/admin'))
  } catch (err) {
    attempts.value++
    if (attempts.value >= 5) {
      lockedUntil.value = Date.now() + 60_000
      attempts.value = 0
    }
    error.value = (err as Error).message || 'Sign in failed'
    password.value = ''
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div
    v-if="!configured"
    class="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center"
  >
    <div class="rounded-lg border border-default p-6">
      <h1 class="text-xl font-semibold text-highlighted">
        Admin isn't connected yet
      </h1>
      <p class="mt-2 text-sm text-muted">
        Add the Supabase keys as environment variables and redeploy:
      </p>
      <pre class="mt-4 overflow-x-auto rounded-md bg-elevated p-3 text-xs">NUXT_PUBLIC_SUPABASE_URL=https://&lt;project&gt;.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=&lt;anon key&gt;</pre>
      <p class="mt-3 text-xs text-dimmed">
        Both live in the Supabase dashboard under Project Settings → API. Run
        <code>supabase/schema.sql</code> first — see <code>SETUP.md</code>.
      </p>
    </div>
  </div>

  <div
    v-else
    class="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center"
  >
    <h1 class="text-xl font-semibold text-highlighted">
      Sign in
    </h1>
    <p class="mt-1 mb-6 text-sm text-muted">
      Administrator access only.
    </p>

    <form
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <UFormField
        label="Email"
        name="email"
      >
        <UInput
          v-model="email"
          type="email"
          autocomplete="username"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Password"
        name="password"
      >
        <UInput
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :description="error"
      />

      <UAlert
        v-if="lockedFor > 0"
        color="warning"
        variant="subtle"
        :description="`Too many attempts. Try again in ${lockedFor}s.`"
      />

      <UButton
        type="submit"
        :loading="pending"
        :disabled="lockedFor > 0"
        label="Sign in"
        block
      />
    </form>
  </div>
</template>
