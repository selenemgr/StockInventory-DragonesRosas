import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { House } from '../lib/types'
import { Del, Empty, NoteCell, MoneyTag, Stat } from '../components/ui'

export default function Casas() {
  const { user, userName } = useSession()
  const houses = useTable<House>('houses')
  const [h, setH] = useState({ qty: '', loot: '', note: '' })

  return (
    <>
      {houses.error && <p className="error">{houses.error}</p>}
      <section className="stats">
        <Stat label="🏠 Casas robadas" value={houses.rows.reduce((a, r) => a + Number(r.qty), 0)} />
        <Stat label="💵 Botín total (dinero limpio)" value={money(houses.rows.reduce((a, r) => a + Number(r.loot), 0))} tone="good" />
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!Number(h.qty) || !Number(h.loot)) return
        void houses.insert({ user_id: user?.id ?? null, name: '', qty: Number(h.qty), loot: Number(h.loot), note: h.note } as Partial<House>, `registrar casas: x${h.qty}`)
        setH({ qty: '', loot: '', note: '' })
      }}>
        <input type="number" min="1" placeholder="Cantidad de casas" value={h.qty} onChange={e => setH({ ...h, qty: e.target.value })} />
        <input type="number" min="0" placeholder="Botín conseguido" value={h.loot} onChange={e => setH({ ...h, loot: e.target.value })} />
        <input placeholder="Nota" value={h.note} onChange={e => setH({ ...h, note: e.target.value })} />
        <button>Registrar</button>
      </form>
      <table>
        <thead><tr><th>Fecha</th><th>Registrado por</th><th>Casas</th><th>Botín</th><th>Dinero</th><th>Nota</th><th /></tr></thead>
        <tbody>
          {houses.rows.length === 0 && <Empty cols={7} />}
          {houses.rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td><td>{userName(r.user_id)}</td><td>🏠 {r.qty}</td><td>{money(r.loot)}</td><td><MoneyTag type="limpio" /></td>
              <td><NoteCell value={r.note} onSave={note => houses.update(r.id, { note }, 'editar nota')} /></td><td><Del onClick={() => houses.remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
