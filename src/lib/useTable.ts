import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from '../context/Session'

/** Tabla con realtime. Toda mutación queda registrada en logs. */
export function useTable<T extends { id: string }>(table: string, orderBy = 'created_at', ascending = false) {
  const { log } = useSession()
  const [rows, setRows] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending })
    if (error) setError(error.message)
    else { setError(null); setRows((data ?? []) as T[]) }
  }, [table, orderBy, ascending])

  useEffect(() => {
    load()
    const ch = supabase
      .channel(`rt-${table}-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [table, load])

  const insert = async (values: Partial<T>, label = 'crear registro') => {
    const { error } = await supabase.from(table).insert(values as never)
    if (error) alert(error.message)
    else log(label, table, values as Record<string, unknown>)
    await load()
  }

  const update = async (id: string, values: Partial<T>, label = 'modificar registro') => {
    const { error } = await supabase.from(table).update(values as never).eq('id', id)
    if (error) alert(error.message)
    else log(label, table, { id, ...values } as Record<string, unknown>)
    await load()
  }

  const remove = async (id: string, label = 'eliminar registro') => {
    const old = rows.find(r => r.id === id)
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) alert(error.message)
    else log(label, table, (old ?? { id }) as Record<string, unknown>)
    await load()
  }

  return { rows, error, insert, update, remove }
}
