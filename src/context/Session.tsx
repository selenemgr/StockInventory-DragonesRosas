import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/types'

interface Ctx {
  users: User[]
  user: User | null
  login: (u: User) => void
  logout: () => void
  addUser: (name: string) => Promise<void>
  userName: (id: string | null | undefined) => string
  log: (action: string, entity: string, detail?: Record<string, unknown>) => void
}

const SessionCtx = createContext<Ctx>(null!)
export const useSession = () => useContext(SessionCtx)

const KEY = 'dr-user'

/** Guarda un log. La consulta de supabase-js solo se envía al esperarla, por eso el await. */
async function insertLog(row: Record<string, unknown>) {
  const { error } = await supabase.from('logs').insert(row)
  if (error) console.error('No se pudo guardar el log:', error.message)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [user, setUser] = useState<User | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('users').select('*').order('name')
    const list = (data ?? []) as User[]
    setUsers(list)
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) setUser(list.find(u => u.id === saved) ?? null)
    } catch { /* sin storage */ }
  }, [])

  useEffect(() => { load() }, [load])

  const log: Ctx['log'] = (action, entity, detail = {}) => {
    void insertLog({ user_id: user?.id ?? null, user_name: user?.name ?? null, action, entity, detail })
  }

  const login = (u: User) => {
    setUser(u)
    try { localStorage.setItem(KEY, u.id) } catch { /* ignore */ }
    void insertLog({ user_id: u.id, user_name: u.name, action: 'inicio de sesión', entity: 'sesion', detail: {} })
  }

  const logout = () => {
    if (user) log('cierre de sesión', 'sesion')
    setUser(null)
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  }

  const addUser = async (name: string) => {
    const { data } = await supabase.from('users').insert({ name }).select().single()
    await load()
    if (data) {
      void insertLog({ user_id: user?.id ?? null, user_name: user?.name ?? null, action: `añadir miembro: ${name}`, entity: 'users', detail: { name } })
      login(data as User)
    }
  }

  const userName = (id: string | null | undefined) => users.find(u => u.id === id)?.name ?? '—'

  return <SessionCtx.Provider value={{ users, user, login, logout, addUser, userName, log }}>{children}</SessionCtx.Provider>
}
