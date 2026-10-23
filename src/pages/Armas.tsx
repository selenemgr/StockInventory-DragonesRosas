import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { MoneyType } from '../lib/moneyType'
import type { Weapon, WeaponMove, WeaponPart, WeaponPartMove } from '../lib/types'
import { Del, Empty, NoteCell, MoneySelect, MoneyTag, Stat } from '../components/ui'

type Tab = 'stock' | 'fabricacion' | 'ventas'

const WEAPON_EMOJIS = [
  { emoji: '🔫', label: 'Pistola' },
  { emoji: '⚡', label: 'Subfusil' },
  { emoji: '💥', label: 'Escopeta' },
  { emoji: '🎯', label: 'Fusil' },
  { emoji: '🔸', label: 'Balas' },
  { emoji: '🔪', label: 'Melee' },
]
const EmojiOptions = () => <>{WEAPON_EMOJIS.map(e => <option key={e.emoji} value={e.emoji}>{e.emoji} {e.label}</option>)}</>
const TONE: Record<WeaponMove['kind'], string> = { ingreso: 'good', retiro: 'bad', compra: 'good', venta: 'bad' }

/** Borra un movimiento de armas y revierte su efecto en el stock. */
function removeWeaponMove(weapons: ReturnType<typeof useTable<Weapon>>, moves: ReturnType<typeof useTable<WeaponMove>>, m: WeaponMove) {
  const w = weapons.rows.find(x => x.id === m.weapon_id)
  if (w) {
    const added = m.kind === 'ingreso' || m.kind === 'compra'
    void weapons.update(w.id, { stock: w.stock + (added ? -m.qty : m.qty) }, `revertir ${m.kind} de ${w.name} x${m.qty}`)
  }
  void moves.remove(m.id)
}

type Tables = { weapons: ReturnType<typeof useTable<Weapon>>; moves: ReturnType<typeof useTable<WeaponMove>> }

export default function Armas() {
  const [tab, setTab] = useState<Tab>('stock')
  const weapons = useTable<Weapon>('weapons', 'name', true)
  const moves = useTable<WeaponMove>('weapon_moves')
  const props = { weapons, moves }
  return (
    <>
      <div className="tabs left" role="tablist">
        <button role="tab" aria-selected={tab === 'stock'} className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>📦 Stock</button>
        <button role="tab" aria-selected={tab === 'fabricacion'} className={tab === 'fabricacion' ? 'active' : ''} onClick={() => setTab('fabricacion')}>🛠️ Fabricación</button>
        <button role="tab" aria-selected={tab === 'ventas'} className={tab === 'ventas' ? 'active' : ''} onClick={() => setTab('ventas')}>💵 Ventas de armas</button>
      </div>
      {weapons.error && <p className="error">{weapons.error}</p>}
      {tab === 'stock' ? <Stock {...props} /> : tab === 'fabricacion' ? <Fabricacion /> : <Ventas {...props} />}
    </>
  )
}

function Stock({ weapons, moves }: Tables) {
  const { user, userName } = useSession()
  const [form, setForm] = useState({ name: '', emoji: WEAPON_EMOJIS[0].emoji, note: '' })
  const [mv, setMv] = useState({ kind: 'ingreso' as 'ingreso' | 'retiro', weapon: '', qty: '', note: '' })
  const weaponName = (id: string) => { const w = weapons.rows.find(x => x.id === id); return w ? `${w.emoji} ${w.name}` : '—' }
  const history = moves.rows.filter(m => m.kind === 'ingreso' || m.kind === 'retiro')

  const submitMove = (e: React.FormEvent) => {
    e.preventDefault()
    const w = weapons.rows.find(x => x.id === mv.weapon)
    const qty = Number(mv.qty)
    if (!w || !user || qty <= 0) return
    if (mv.kind === 'retiro' && qty > w.stock && !confirm('No hay stock suficiente, ¿registrar igualmente?')) return
    void weapons.update(w.id, { stock: w.stock + (mv.kind === 'ingreso' ? qty : -qty) }, `${mv.kind} de arma: ${w.name} x${qty}`)
    void moves.insert({ user_id: user.id, weapon_id: w.id, kind: mv.kind, qty, note: mv.note }, `${mv.kind} arma: ${w.name} x${qty}`)
    setMv({ ...mv, qty: '', note: '' })
  }

  return (
    <>
      <section className="stats stack">
        {weapons.rows.map(w => <Stat key={w.id} label={`${w.emoji} ${w.name}`} value={w.stock} />)}
      </section>

      <h2>Armas</h2>
      <table>
        <thead><tr><th>Arma</th><th>Inventario</th><th>Notas</th><th /></tr></thead>
        <tbody>
          {weapons.rows.length === 0 && <Empty cols={4} />}
          {weapons.rows.map(w => (
            <tr key={w.id}>
              <td>
                <select value={w.emoji} title="Cambiar emoji" onChange={e => weapons.update(w.id, { emoji: e.target.value }, `cambiar emoji de ${w.name}`)}><EmojiOptions /></select> {w.name}
              </td>
              <td><input className="cell" type="number" defaultValue={w.stock} key={'s' + w.stock} onBlur={e => Number(e.target.value) !== w.stock && weapons.update(w.id, { stock: Number(e.target.value) }, `modificar stock de ${w.name}`)} /></td>
              <td><NoteCell value={w.note} onSave={note => weapons.update(w.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => weapons.remove(w.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!form.name.trim()) return
        void weapons.insert({ name: form.name.trim(), emoji: form.emoji, note: form.note }, `añadir arma: ${form.name.trim()}`)
        setForm({ ...form, name: '', note: '' })
      }}>
        <select value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} title="Emoji"><EmojiOptions /></select>
        <input placeholder="Nueva arma (ej. Pistola MK2)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Notas (opcional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        <button>Añadir arma</button>
      </form>

      <h2>Ingreso / Retiro</h2>
      <form className="card row" onSubmit={submitMove}>
        <select className={`tone ${TONE[mv.kind]}`} value={mv.kind} onChange={e => setMv({ ...mv, kind: e.target.value as 'ingreso' | 'retiro' })}>
          <option value="ingreso" className="good">Ingreso</option><option value="retiro" className="bad">Retiro</option>
        </select>
        <select value={mv.weapon} onChange={e => setMv({ ...mv, weapon: e.target.value })} required>
          <option value="">Arma…</option>
          {weapons.rows.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={mv.qty} onChange={e => setMv({ ...mv, qty: e.target.value })} />
        <input placeholder="Notas (opcional)" value={mv.note} onChange={e => setMv({ ...mv, note: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial de ingreso y retiro</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Arma</th><th>Cant.</th><th /><th /></tr></thead>
        <tbody>
          {history.length === 0 && <Empty cols={7} />}
          {history.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td>
              <td><span className={`tag ${TONE[r.kind]}`}>{r.kind === 'ingreso' ? 'Ingreso' : 'Retiro'}</span></td>
              <td>{userName(r.user_id)}</td><td>{weaponName(r.weapon_id)}</td>
              <td className={`amt ${TONE[r.kind]}`}>{r.kind === 'ingreso' ? '+' : '−'}{r.qty}</td>
              <td><NoteCell tooltip value={r.note} onSave={note => moves.update(r.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => removeWeaponMove(weapons, moves, r)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Ventas({ weapons, moves }: Tables) {
  const { user, userName } = useSession()
  const [sale, setSale] = useState({ kind: 'venta' as 'compra' | 'venta', money: 'limpio' as MoneyType, weapon: '', qty: '', note: '' })
  const weaponName = (id: string) => { const w = weapons.rows.find(x => x.id === id); return w ? `${w.emoji} ${w.name}` : '—' }
  const history = moves.rows.filter(m => m.kind === 'compra' || m.kind === 'venta')
  const totalValue = weapons.rows.reduce((a, w) => a + w.stock * Number(w.value), 0)
  const selected = weapons.rows.find(w => w.id === sale.weapon)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(sale.qty)
    if (!selected || !user || qty <= 0) return
    const buying = sale.kind === 'compra'
    if (!buying && qty > selected.stock && !confirm('No hay stock suficiente, ¿registrar igualmente?')) return
    void weapons.update(selected.id, { stock: selected.stock + (buying ? qty : -qty) }, `${sale.kind} de arma: ${selected.name} x${qty}`)
    void moves.insert({ user_id: user.id, weapon_id: selected.id, kind: buying ? 'compra' : 'venta', money_type: sale.money, qty, unit_price: Number(selected.value), note: sale.note }, `${sale.kind} arma: ${selected.name} x${qty}`)
    setSale({ ...sale, qty: '', note: '' })
  }

  return (
    <>
      <section className="stats stack">
        <Stat label="💰 Valor estimado de las armas" value={money(totalValue)} tone="good" />
        {weapons.rows.map(w => <Stat key={w.id} label={`${w.emoji} ${w.name}`} value={w.stock} />)}
      </section>

      <h2>Tabla de valores</h2>
      <table>
        <thead><tr><th>Arma</th><th>Inventario</th><th>Valor</th><th>Valor del stock</th></tr></thead>
        <tbody>
          {weapons.rows.length === 0 && <Empty cols={4} />}
          {weapons.rows.map(w => (
            <tr key={w.id}>
              <td>{w.emoji} {w.name}</td>
              <td>{w.stock}</td>
              <td><input className="cell" type="number" defaultValue={w.value} key={'v' + w.value} onBlur={e => Number(e.target.value) !== Number(w.value) && weapons.update(w.id, { value: Number(e.target.value) }, `modificar valor de ${w.name}`)} /></td>
              <td>{money(w.stock * Number(w.value))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Compra / Venta</h2>
      <form className="card row" onSubmit={submit}>
        <select className={`tone ${sale.kind === 'compra' ? 'good' : 'bad'}`} value={sale.kind} onChange={e => setSale({ ...sale, kind: e.target.value as 'compra' | 'venta' })}>
          <option value="compra" className="good">Compra</option><option value="venta" className="bad">Venta</option>
        </select>
        <select value={sale.weapon} onChange={e => setSale({ ...sale, weapon: e.target.value })} required>
          <option value="">Arma…</option>
          {weapons.rows.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.name} ({money(w.value)})</option>)}
        </select>
        <MoneySelect value={sale.money} onChange={v => setSale({ ...sale, money: v })} />
        <input type="number" min="1" placeholder="Cantidad" value={sale.qty} onChange={e => setSale({ ...sale, qty: e.target.value })} />
        <input placeholder="Notas (opcional)" value={sale.note} onChange={e => setSale({ ...sale, note: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial de compra y venta</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Arma</th><th>Cant.</th><th>Precio u.</th><th>Total</th><th>Dinero</th><th /><th /></tr></thead>
        <tbody>
          {history.length === 0 && <Empty cols={10} />}
          {history.map(s => (
            <tr key={s.id}>
              <td>{dateTime(s.created_at)}</td>
              <td><span className={`tag ${TONE[s.kind]}`}>{s.kind === 'compra' ? 'Compra' : 'Venta'}</span></td>
              <td>{userName(s.user_id)}</td><td>{weaponName(s.weapon_id)}</td>
              <td>{s.qty}</td>
              <td>{Number(s.unit_price) ? money(s.unit_price) : '—'}</td>
              <td className={`amt ${s.kind === 'venta' ? 'good' : ''}`}>{Number(s.unit_price) ? money(s.qty * Number(s.unit_price)) : '—'}</td>
              <td><MoneyTag type={s.money_type} /></td>
              <td><NoteCell tooltip value={s.note} onSave={note => moves.update(s.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => removeWeaponMove(weapons, moves, s)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Fabricacion() {
  const { user, userName } = useSession()
  const parts = useTable<WeaponPart>('weapon_parts', 'name', true)
  const moves = useTable<WeaponPartMove>('weapon_part_moves')
  const [form, setForm] = useState({ name: '', note: '' })
  const [mv, setMv] = useState({ kind: 'ingreso' as WeaponPartMove['kind'], part: '', qty: '', note: '' })
  const partName = (id: string) => parts.rows.find(p => p.id === id)?.name ?? '—'

  const removePartMove = (r: WeaponPartMove) => {
    const p = parts.rows.find(x => x.id === r.part_id)
    if (p) void parts.update(p.id, { stock: p.stock + (r.kind === 'ingreso' ? -r.qty : r.qty) }, `revertir ${r.kind} de ${p.name} x${r.qty}`)
    void moves.remove(r.id)
  }

  const submitMove = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parts.rows.find(x => x.id === mv.part)
    const qty = Number(mv.qty)
    if (!p || !user || qty <= 0) return
    if (mv.kind === 'retiro' && qty > p.stock && !confirm('No hay stock suficiente, ¿registrar igualmente?')) return
    void parts.update(p.id, { stock: p.stock + (mv.kind === 'ingreso' ? qty : -qty) }, `${mv.kind} de pieza: ${p.name} x${qty}`)
    void moves.insert({ user_id: user.id, part_id: p.id, kind: mv.kind, qty, note: mv.note }, `${mv.kind} pieza: ${p.name} x${qty}`)
    setMv({ ...mv, qty: '', note: '' })
  }

  return (
    <>
      {parts.error && <p className="error">{parts.error}</p>}
      <section className="stats stack">
        {parts.rows.map(p => <Stat key={p.id} label={`⚙️ ${p.name}`} value={p.stock} />)}
      </section>

      <h2>Piezas</h2>
      <table>
        <thead><tr><th>Pieza</th><th>Inventario</th><th>Notas</th><th /></tr></thead>
        <tbody>
          {parts.rows.length === 0 && <Empty cols={4} />}
          {parts.rows.map(p => (
            <tr key={p.id}>
              <td>⚙️ {p.name}</td>
              <td><input className="cell" type="number" defaultValue={p.stock} key={'s' + p.stock} onBlur={e => Number(e.target.value) !== p.stock && parts.update(p.id, { stock: Number(e.target.value) }, `modificar stock de ${p.name}`)} /></td>
              <td><NoteCell value={p.note} onSave={note => parts.update(p.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => parts.remove(p.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!form.name.trim()) return
        void parts.insert({ name: form.name.trim(), note: form.note }, `añadir pieza: ${form.name.trim()}`)
        setForm({ name: '', note: '' })
      }}>
        <input placeholder="Nueva pieza (ej. Cañón, Armazón)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Notas (opcional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        <button>Añadir pieza</button>
      </form>

      <h2>Ingreso / Retiro</h2>
      <form className="card row" onSubmit={submitMove}>
        <select className={`tone ${TONE[mv.kind]}`} value={mv.kind} onChange={e => setMv({ ...mv, kind: e.target.value as WeaponPartMove['kind'] })}>
          <option value="ingreso" className="good">Ingreso</option><option value="retiro" className="bad">Retiro</option>
        </select>
        <select value={mv.part} onChange={e => setMv({ ...mv, part: e.target.value })} required>
          <option value="">Pieza…</option>
          {parts.rows.map(p => <option key={p.id} value={p.id}>⚙️ {p.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={mv.qty} onChange={e => setMv({ ...mv, qty: e.target.value })} />
        <input placeholder="Notas (opcional)" value={mv.note} onChange={e => setMv({ ...mv, note: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial de ingreso y retiro</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Pieza</th><th>Cant.</th><th /><th /></tr></thead>
        <tbody>
          {moves.rows.length === 0 && <Empty cols={7} />}
          {moves.rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td>
              <td><span className={`tag ${TONE[r.kind]}`}>{r.kind === 'ingreso' ? 'Ingreso' : 'Retiro'}</span></td>
              <td>{userName(r.user_id)}</td><td>⚙️ {partName(r.part_id)}</td>
              <td className={`amt ${TONE[r.kind]}`}>{r.kind === 'ingreso' ? '+' : '−'}{r.qty}</td>
              <td><NoteCell tooltip value={r.note} onSave={note => moves.update(r.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => removePartMove(r)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
