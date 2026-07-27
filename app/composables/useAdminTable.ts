/** Thin CRUD wrapper over a Supabase table, with toasts and pending state. */
export function useAdminTable<Row extends Record<string, unknown>>(
  table: string,
  options: { orderBy?: string, ascending?: boolean } = {}
) {
  const supabase = useSupabase()
  const toast = useToast()

  const rows = ref<Row[]>([])
  const pending = ref(false)

  async function list() {
    pending.value = true
    try {
      let query = supabase.from(table).select('*')
      if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      const { data, error } = await query
      if (error) throw error
      rows.value = (data || []) as Row[]
      return rows.value
    } finally {
      pending.value = false
    }
  }

  async function get(id: string) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Row | null
  }

  async function save(row: Partial<Row> & { id?: string }) {
    pending.value = true
    try {
      const payload = { ...row }
      delete payload.created_at
      delete payload.updated_at

      const query = payload.id
        ? supabase.from(table).update(payload).eq('id', payload.id).select().single()
        : supabase.from(table).insert(payload).select().single()

      const { data, error } = await query
      if (error) throw error
      toast.add({ title: 'Saved', icon: 'i-lucide-check-circle', color: 'success' })
      return data as Row
    } catch (error) {
      toast.add({
        title: 'Could not save',
        description: (error as Error).message,
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      throw error
    } finally {
      pending.value = false
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      toast.add({ title: 'Could not delete', description: error.message, color: 'error' })
      throw error
    }
    rows.value = rows.value.filter(row => (row as { id?: string }).id !== id)
    toast.add({ title: 'Deleted', icon: 'i-lucide-trash-2', color: 'neutral' })
  }

  return { rows, pending, list, get, save, remove }
}
