/**
 * Gate for every /admin route except the login page.
 * Client-only: the admin app never renders on the server (see routeRules).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/admin/login') return

  if (!isSupabaseConfigured()) {
    return navigateTo('/admin/login')
  }

  const auth = useAdminAuth()
  await auth.init()

  if (!auth.session.value || !auth.isAdmin.value) {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }
})
