import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime } from '../lib/format'
import type { Deal } from '../lib/types'
import { Del, Empty, NoteCell, Stat } from '../components/ui'

const DEFAULT_COLOR = '#e58fb0'

export default function Tratos() {
  const { user, userName } = useSession()
  const deals = useTable<Deal>('deals')
  const [d, setD] = useState({ gang: '', color: DEFAULT_COLOR, their: '', ours: '' })

  return (
    <>
      {deals.error && <p className="error">{deals.error}</p>}
      <section className="stats">
        <Stat label="🤝 Tratos activos" value={deals.rows.length} />
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!d.gang.trim()) return
        void deals.insert({ user_id: user?.id ?? null, gang: d.gang.trim(), color: d.color, their_benefits: d.their, our_benefits: d.ours } as Partial<Deal>, `nuevo trato con ${d.gang.trim()}`)
        setD({ gang: '', color: DEFAULT_COLOR, their: '', ours: '' })
      }}>
        <input placeholder="Nombre de la banda" value={d.gang} onChange={e => setD({ ...d, gang: e.target.value })} />
        <input type="color" title="Color de la banda" value={d.color} onChange={e => setD({ ...d, color: e.target.value })} style={{ width: 52, padding: 2 }} />
        <input placeholder="Beneficios para nosotros" value={d.ours} onChange={e => setD({ ...d, ours: e.target.value })} />
        <input placeholder="Beneficios para ellos" value={d.their} onChange={e => setD({ ...d, their: e.target.value })} />
        <button>Añadir trato</button>
      </form>

      <table>
        <thead><tr><th>Banda</th><th>Nuestros beneficios</th><th>Sus beneficios</th><th>Registrado por</th><th>Fecha</th><th /></tr></thead>
        <tbody>
          {deals.rows.length === 0 && <Empty cols={6} />}
          {deals.rows.map(r => (
            <tr key={r.id}>
              <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: r.color, display: 'inline-block' }} />{r.gang}
              </span></td>
              <td><NoteCell value={r.our_benefits} onSave={v => deals.update(r.id, { our_benefits: v }, `editar beneficios nuestros (${r.gang})`)} /></td>
              <td><NoteCell value={r.their_benefits} onSave={v => deals.update(r.id, { their_benefits: v }, `editar beneficios suyos (${r.gang})`)} /></td>
              <td>{userName(r.user_id)}</td><td>{dateTime(r.created_at)}</td>
              <td><Del onClick={() => deals.remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
