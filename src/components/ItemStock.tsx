import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { MoneyType } from '../lib/moneyType'
import type { ToolItem, ToolMove } from '../lib/types'
import { Del, Empty, Info, MoneySelect, MoneyTag, Stat } from './ui'

type Kind = ToolMove['kind']
const TONE: Record<Kind, string> = { ingreso: 'good', retiro: 'bad', compra: 'warn' }
const LABEL: Record<Kind, string> = { ingreso: 'Ingreso', retiro: 'Retiro', compra: 'Compra' }

/** Stock + ingreso/retiro/compra + historial para una tabla de ítems (herramientas o piezas). */
export function ItemStock({ itemsTable, movesTable, emoji, noun, title }: { itemsTable: string; movesTable: string; emoji: string; noun: string; title: string }) {
  const { user, userName } = useSession()
  const items = useTable<ToolItem>(itemsTable, 'name', true)
  const moves = useTable<ToolMove>(movesTable)
  const [form, setForm] = useState({ name: '', note: '' })
  const [mv, setMv] = useState({ kind: 'ingreso' as Kind, item: '', qty: '', value: '', money: 'limpio' as MoneyType, note: '' })
  const itemName = (id: string) => items.rows.find(x => x.id === id)?.name ?? '—'

  const submitMove = (e: React.FormEvent) => {
    e.preventDefault()
    const it = items.rows.find(x => x.id === mv.item)
    const qty = Number(mv.qty)
    if (!it || !user || qty <= 0) return
    if (mv.kind === 'compra' && !Number(mv.value)) return
    if (mv.kind === 'retiro' && qty > it.stock && !confirm('No hay stock suficiente, ¿registrar igualmente?')) return
    const buying = mv.kind === 'compra'
    void items.update(it.id, { stock: it.stock + (mv.kind === 'retiro' ? -qty : qty) }, `${mv.kind} de ${noun}: ${it.name} x${qty}`)
    void moves.insert(
      { user_id: user.id, item_id: it.id, kind: mv.kind, qty, unit_price: buying ? Number(mv.value) : 0, money_type: mv.money, note: mv.note },
      `${mv.kind} ${noun}: ${it.name} x${qty}`,
    )
    setMv({ ...mv, qty: '', value: '', note: '' })
  }

  /** Borra un movimiento y revierte su efecto en el stock. */
  const removeMove = (m: ToolMove) => {
    const it = items.rows.find(x => x.id === m.item_id)
    if (it) void items.update(it.id, { stock: it.stock + (m.kind === 'retiro' ? m.qty : -m.qty) }, `revertir ${m.kind} de ${it.name} x${m.qty}`)
    void moves.remove(m.id)
  }

  return (
    <>
      {items.error && <p className="error">{items.error}</p>}
      <section className="stats stack">
        {items.rows.map(x => <Stat key={x.id} label={`${emoji} ${x.name}`} value={`${x.stock} en stock`} />)}
      </section>

      <h2>{title}</h2>
      <table>
        <thead><tr><th>{noun[0].toUpperCase() + noun.slice(1)}</th><th>Inventario</th><th>Notas</th><th /></tr></thead>
        <tbody>
          {items.rows.length === 0 && <Empty cols={4} />}
          {items.rows.map(x => (
            <tr key={x.id}>
              <td>{emoji} {x.name}</td>
              <td><input className="cell" type="number" defaultValue={x.stock} key={'s' + x.stock} onBlur={e => Number(e.target.value) !== x.stock && items.update(x.id, { stock: Number(e.target.value) }, `modificar stock de ${x.name}`)} /></td>
              <td>{x.note}</td>
              <td><Del onClick={() => items.remove(x.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!form.name.trim()) return
        void items.insert({ name: form.name.trim(), note: form.note }, `añadir ${noun}: ${form.name.trim()}`)
        setForm({ name: '', note: '' })
      }}>
        <input placeholder={`Nueva ${noun}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Notas (opcional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        <button>Añadir {noun}</button>
      </form>

      <h2>Ingreso / Retiro / Compra</h2>
      <form className="card row" onSubmit={submitMove}>
        <select className={`tone ${TONE[mv.kind]}`} value={mv.kind} onChange={e => setMv({ ...mv, kind: e.target.value as Kind })}>
          <option value="ingreso" className="good">Ingreso</option>
          <option value="retiro" className="bad">Retiro</option>
          <option value="compra" className="warn">Compra</option>
        </select>
        <select value={mv.item} onChange={e => setMv({ ...mv, item: e.target.value })} required>
          <option value="">{noun[0].toUpperCase() + noun.slice(1)}…</option>
          {items.rows.map(x => <option key={x.id} value={x.id}>{emoji} {x.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={mv.qty} onChange={e => setMv({ ...mv, qty: e.target.value })} />
        {mv.kind === 'compra' && (
          <>
            <input type="number" min="0" placeholder="Valor (por unidad)" value={mv.value} onChange={e => setMv({ ...mv, value: e.target.value })} required />
            <MoneySelect value={mv.money} onChange={v => setMv({ ...mv, money: v })} />
          </>
        )}
        <input placeholder="Notas (opcional)" value={mv.note} onChange={e => setMv({ ...mv, note: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>{noun[0].toUpperCase() + noun.slice(1)}</th><th>Cant.</th><th>Valor u.</th><th>Total</th><th>Dinero</th><th /><th /></tr></thead>
        <tbody>
          {moves.rows.length === 0 && <Empty cols={10} />}
          {moves.rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td>
              <td><span className={`tag ${TONE[r.kind]}`}>{LABEL[r.kind]}</span></td>
              <td>{userName(r.user_id)}</td><td>{emoji} {itemName(r.item_id)}</td>
              <td className={`amt ${TONE[r.kind]}`}>{r.kind === 'retiro' ? '−' : '+'}{r.qty}</td>
              <td>{r.kind === 'compra' ? money(r.unit_price) : '—'}</td>
              <td>{r.kind === 'compra' ? money(r.qty * Number(r.unit_price)) : '—'}</td>
              <td>{r.kind === 'compra' ? <MoneyTag type={r.money_type} /> : '—'}</td>
              <td><Info text={r.note || 'Sin notas'} /></td>
              <td><Del onClick={() => removeMove(r)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
