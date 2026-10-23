import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import type { InvItem } from '../lib/types'
import { Del, Empty, UserSelect } from '../components/ui'

export default function Inventario() {
  const { users, user, userName, log } = useSession()
  const { rows, insert, update, remove } = useTable<InvItem>('inventory', 'item', true)
  const [filter, setFilter] = useState('')
  const [f, setF] = useState({ user: user?.id ?? '', item: '', qty: '' })
  const [moving, setMoving] = useState<{ id: string; to: string; qty: string } | null>(null)

  const shown = rows.filter(r => !filter || r.user_id === filter)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(f.qty)
    const item = f.item.trim()
    if (!f.user || !item || qty <= 0) return
    const existing = rows.find(r => r.user_id === f.user && r.item.toLowerCase() === item.toLowerCase())
    if (existing) void update(existing.id, { qty: existing.qty + qty }, `meter item: ${item} x${qty} a ${userName(f.user)}`)
    else void insert({ user_id: f.user, item, qty }, `meter item: ${item} x${qty} a ${userName(f.user)}`)
    setF({ ...f, item: '', qty: '' })
  }

  const transfer = async () => {
    if (!moving) return
    const src = rows.find(r => r.id === moving.id)
    const qty = Number(moving.qty)
    if (!src || !moving.to || moving.to === src.user_id || qty <= 0 || qty > src.qty) return
    const dest = rows.find(r => r.user_id === moving.to && r.item.toLowerCase() === src.item.toLowerCase())
    if (dest) await update(dest.id, { qty: dest.qty + qty }, 'movimiento (destino)')
    else await insert({ user_id: moving.to, item: src.item, qty }, 'movimiento (destino)')
    if (qty === src.qty) await remove(src.id, 'movimiento (origen vacío)')
    else await update(src.id, { qty: src.qty - qty }, 'movimiento (origen)')
    log(`mover ${src.item} x${qty}: ${userName(src.user_id)} → ${userName(moving.to)}`, 'inventory', { item: src.item, qty })
    setMoving(null)
  }

  return (
    <>
      <form className="card row" onSubmit={add}>
        <UserSelect users={users} value={f.user} onChange={v => setF({ ...f, user: v })} />
        <input placeholder="Objeto" value={f.item} onChange={e => setF({ ...f, item: e.target.value })} />
        <input type="number" min="1" placeholder="Cantidad" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} />
        <button>Añadir al inventario</button>
      </form>

      <div className="row filter">
        <label>Ver inventario de:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <table>
        <thead><tr><th>Usuario</th><th>Objeto</th><th>Cantidad</th><th>Mover</th><th /></tr></thead>
        <tbody>
          {shown.length === 0 && <Empty cols={5} />}
          {shown.map(r => (
            <tr key={r.id}>
              <td>{userName(r.user_id)}</td><td>{r.item}</td>
              <td><input className="cell" type="number" defaultValue={r.qty} key={r.qty} onBlur={e => Number(e.target.value) !== r.qty && update(r.id, { qty: Number(e.target.value) }, `ajustar ${r.item} de ${userName(r.user_id)}`)} /></td>
              <td>
                {moving?.id === r.id ? (
                  <span className="row">
                    <select value={moving.to} onChange={e => setMoving({ ...moving, to: e.target.value })}>
                      <option value="">A…</option>
                      {users.filter(u => u.id !== r.user_id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input className="cell" type="number" min="1" max={r.qty} value={moving.qty} onChange={e => setMoving({ ...moving, qty: e.target.value })} />
                    <button onClick={transfer}>OK</button>
                    <button className="ghost" onClick={() => setMoving(null)}>✕</button>
                  </span>
                ) : <button className="ghost" onClick={() => setMoving({ id: r.id, to: '', qty: String(r.qty) })}>↔ Mover</button>}
              </td>
              <td><Del onClick={() => remove(r.id, `eliminar ${r.item} de ${userName(r.user_id)}`)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
