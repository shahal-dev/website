import type { Session } from '@supabase/supabase-js'

const session = ref<Session | null>(null)
const isAdmin = ref(false)
const ready = ref(false)

/**
 * Admin session state.
 *
 * Being signed in is not the same as being an admin: `isAdmin` is confirmed by
 * asking the database (RLS lets a user read only their own row in `admins`),
 * so the flag can't be faked client-side — and even if it were, every write
 * would still be rejected by row level security.
 */
export function useAdminAuth() {
  const supabase = useSupabase()

  async function checkAdmin(userId?: string) {
    if (!userId) {
      isAdmin.value = false
      return false
    }
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
    isAdmin.value = Boolean(data)
    return isAdmin.value
  }

  async function init() {
    if (ready.value) return
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    await checkAdmin(data.session?.user?.id)
    ready.value = true

    supabase.auth.onAuthStateChange(async (_event, next) => {
      session.value = next
      await checkAdmin(next?.user?.id)
    })
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
    const admin = await checkAdmin(data.user?.id)
    if (!admin) {
      // Authenticated but not on the allowlist — don't leave a session behind.
      await supabase.auth.signOut()
      session.value = null
      throw new Error('This account is not an administrator.')
    }
    return data.session
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
    isAdmin.value = false
    await navigateTo('/admin/login')
  }

  return {
    session: readonly(session),
    isAdmin: readonly(isAdmin),
    ready: readonly(ready),
    init,
    signIn,
    signOut,
    user: computed(() => session.value?.user || null)
  }
}
