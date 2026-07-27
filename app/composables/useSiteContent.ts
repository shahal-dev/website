interface ContentResponse<T> {
  source: 'supabase' | 'files'
  items?: T[]
  item?: T | null
}

/**
 * Fetch a collection through /api/content, which reads Supabase when it's
 * configured and falls back to the files in content/ when it isn't.
 */
export async function useContentItems<T>(key: string, path: string) {
  const { data } = await useAsyncData(key, () => $fetch<ContentResponse<T>>(`/api/content/${path}`))
  return computed<T[]>(() => data.value?.items || [])
}

export async function useContentItem<T>(key: string, path: string) {
  const { data } = await useAsyncData(key, () => $fetch<ContentResponse<T>>(`/api/content/${path}`))
  return computed<T | null>(() => data.value?.item || null)
}

/**
 * Page copy (title/description/body) with the database taking precedence over
 * the file version — so editing a page in the admin overrides the checked-in
 * copy without anything having to be migrated first.
 */
export async function usePageCopy(key: string, fallback: { title?: string, description?: string, body?: string } = {}) {
  const remote = await useContentItem<{ title?: string, description?: string, body?: string }>(`page-copy-${key}`, `pages/${key}`)
  return computed(() => ({
    title: remote.value?.title || fallback.title || '',
    description: remote.value?.description || fallback.description || '',
    body: remote.value?.body || fallback.body || ''
  }))
}
