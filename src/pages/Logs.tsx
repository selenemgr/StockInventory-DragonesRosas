import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime } from '../lib/format'
import { sectionLabel } from '../lib/sections'
import type { LogRow } from '../lib/types'
import { Empty, Stat } from '../components/ui'

export default function Logs() {
  const { users, userName } = useSession()
  const { rows, error } = useTable<LogRow>('logs')
  const [who, setWho] = useState('')
  const [section, setSection] = useState('')
  const [q, setQ] = useState('')

  // Detalle legible: "campo: valor", resolviendo usuarios y ocultando ids internos
  const detailText = (d: Record<string, unknown> | null) =>
    Object.entries(d ?? {})
      .filter(([k, v]) => v !== null && v !== '' && (k === 'user_id' || k === 'owner_user_id' || !k.endsWith('_id')) && k !== 'id' && k !== 'created_at')
      .map(([k, v]) => `${k.endsWith('user_id') ? 'usuario' : k}: ${k.endsWith('user_id') ? userName(String(v)) : typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' · ')

  const sections = Array.from(new Set(rows.map(r => r.entity))).sort()
  const shown = rows
    .filter(r => !who || r.user_id === who)
    .filter(r => !section || r.entity === section)
    .filter(r => !q || `${r.action} ${sectionLabel(r.entity)} ${r.user_name ?? ''} ${detailText(r.detail)}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 1000)

  return (
    <>
      {error && <p className="error">{error}</p>}
      <section className="stats">
        <Stat label="📜 Acciones registradas" value={rows.length} />
        <Stat label="👁️ Mostrando" value={shown.length} />
      </section>
      <div className="row filter">
        <select value={who} onChange={e => setWho(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={section} onChange={e => setSection(e.target.value)}>
          <option value="">Todas las secciones</option>
          {sections.map(s => <option key={s} value={s}>{sectionLabel(s)}</option>)}
        </select>
        <input placeholder="Buscar en acción, usuario o detalle…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Sección</th><th>Detalle</th></tr></thead>
        <tbody>
          {shown.length === 0 && <Empty cols={5} />}
          {shown.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td><td>{r.user_name ?? '—'}</td><td>{r.action}</td>
              <td><span className="tag">{sectionLabel(r.entity)}</span></td>
              <td className="detail">{detailText(r.detail)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
