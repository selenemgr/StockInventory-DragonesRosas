import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { Fine } from '../lib/types'
import { Del, Empty, Stat, UserSelect } from '../components/ui'

export default function Multas() {
  const { users, userName } = useSession()
  const { rows, insert, update, remove } = useTable<Fine>('fines')
  const [f, setF] = useState({ user: '', amount: '', reason: '' })

  const fines = rows.filter(r => r.kind === 'multa')
  const pending = fines.filter(r => !r.paid).reduce((a, r) => a + Number(r.amount), 0)
  const paid = fines.filter(r => r.paid).reduce((a, r) => a + Number(r.amount), 0)

  return (
    <>
      <section className="stats">
        <Stat label="⏳ Multas pendientes" value={money(pending)} tone="bad" />
        <Stat label="✅ Multas pagadas" value={money(paid)} />
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!f.user || !Number(f.amount)) return
        void insert({ user_id: f.user, kind: 'multa', amount: Number(f.amount), reason: f.reason }, `registrar multa a ${userName(f.user)}`)
        setF({ ...f, amount: '', reason: '' })
      }}>
        <UserSelect users={users} value={f.user} onChange={v => setF({ ...f, user: v })} />
        <input type="number" min="0" placeholder="Cantidad" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
        <input placeholder="Motivo" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
        <button>Registrar</button>
      </form>

      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Cantidad</th><th>Motivo</th><th>Pagada</th><th /></tr></thead>
        <tbody>
          {fines.length === 0 && <Empty cols={6} />}
          {fines.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td><td>{userName(r.user_id)}</td>
              <td>{money(r.amount)}</td><td>{r.reason}</td>
              <td>
                <input type="checkbox" checked={r.paid} onChange={e => update(r.id, { paid: e.target.checked }, e.target.checked ? 'marcar multa pagada' : 'marcar multa pendiente')} />
              </td>
              <td><Del onClick={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
