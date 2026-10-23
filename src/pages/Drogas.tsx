import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { MoneyType } from '../lib/moneyType'
import type { Drug, DrugMaterial, DrugMaterialMove, DrugSale } from '../lib/types'
import { ItemStock } from '../components/ItemStock'
import { Del, Empty, Info, MoneySelect, MoneyTag, Stat } from '../components/ui'

const DRUG_EMOJIS = ['💊', '🌿', '🍃', '🍄', '💉', '❄️', '🧪', '🔥', '🍬', '🌱', '🌵', '🍁', '💎', '⚗️', '🧂', '☁️']

type Tab = 'hechas' | 'materia' | 'materiales'

export default function Drogas() {
  const [tab, setTab] = useState<Tab>('hechas')
  return (
    <>
      <div className="tabs left" role="tablist">
        <button role="tab" aria-selected={tab === 'hechas'} className={tab === 'hechas' ? 'active' : ''} onClick={() => setTab('hechas')}>💊 Drogas</button>
        <button role="tab" aria-selected={tab === 'materia'} className={tab === 'materia' ? 'active' : ''} onClick={() => setTab('materia')}>🌱 Semillas y hojas</button>
        <button role="tab" aria-selected={tab === 'materiales'} className={tab === 'materiales' ? 'active' : ''} onClick={() => setTab('materiales')}>🧪 Materiales</button>
      </div>
      {tab === 'hechas' ? <DrogasHechas /> : tab === 'materia' ? <SemillasHojas /> : <ItemStock itemsTable="drug_supplies" movesTable="drug_supply_moves" emoji="🧪" noun="material" title="Materiales" />}
    </>
  )
}

const MAT_EMOJI: Record<DrugMaterial['kind'], string> = { semilla: '🌱', hoja: '🍃' }

function SemillasHojas() {
  const mats = useTable<DrugMaterial>('drug_materials', 'name', true)
  const [form, setForm] = useState({ name: '', kind: 'semilla' as DrugMaterial['kind'], stock: '' })
  const moves = useTable<DrugMaterialMove>('drug_material_moves')
  const { user, userName } = useSession()
  const [mv, setMv] = useState({ kind: 'ingreso' as DrugMaterialMove['kind'], material: '', qty: '', note: '' })
  const matLabel = (id: string) => { const m = mats.rows.find(x => x.id === id); return m ? `${MAT_EMOJI[m.kind]} ${m.name}` : '—' }
  const MV_TONE: Record<DrugMaterialMove['kind'], string> = { ingreso: 'good', consumo: 'bad' }

  const removeMove = (r: DrugMaterialMove) => {
    const m = mats.rows.find(x => x.id === r.material_id)
    if (m) void mats.update(m.id, { stock: m.stock + (r.kind === 'ingreso' ? -r.qty : r.qty) }, `revertir ${r.kind} de ${m.name} x${r.qty}`)
    void moves.remove(r.id)
  }

  const submitMove = (e: React.FormEvent) => {
    e.preventDefault()
    const m = mats.rows.find(x => x.id === mv.material)
    const qty = Number(mv.qty)
    if (!m || !user || qty <= 0) return
    if (mv.kind === 'consumo' && qty > m.stock && !confirm('No hay cantidad suficiente, ¿registrar igualmente?')) return
    void mats.update(m.id, { stock: m.stock + (mv.kind === 'ingreso' ? qty : -qty) }, `${mv.kind} de ${m.kind} ${m.name} x${qty}`)
    void moves.insert({ user_id: user.id, material_id: m.id, kind: mv.kind, qty, note: mv.note }, `${mv.kind}: ${m.name} x${qty}`)
    setMv({ ...mv, qty: '', note: '' })
  }
  const total = (k: DrugMaterial['kind']) => mats.rows.filter(m => m.kind === k).reduce((a, m) => a + m.stock, 0)

  return (
    <>
      {mats.error && <p className="error">{mats.error}</p>}
      <section className="stats">
        <Stat label="🌱 Semillas" value={total('semilla')} />
        <Stat label="🍃 Hojas" value={total('hoja')} />
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!form.name.trim()) return
        void mats.insert({ name: form.name.trim(), kind: form.kind, stock: Number(form.stock) || 0 }, `añadir ${form.kind}: ${form.name.trim()}`)
        setForm({ ...form, name: '', stock: '' })
      }}>
        <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as DrugMaterial['kind'] })}>
          <option value="semilla">🌱 Semilla</option><option value="hoja">🍃 Hoja</option>
        </select>
        <input placeholder="Nombre (ej. Marihuana)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="number" min="0" placeholder="Cantidad" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        <button>Añadir</button>
      </form>

      <table>
        <thead><tr><th>Tipo</th><th>Nombre</th><th>Cantidad</th><th /></tr></thead>
        <tbody>
          {mats.rows.length === 0 && <Empty cols={4} />}
          {mats.rows.map(m => (
            <tr key={m.id}>
              <td>{MAT_EMOJI[m.kind]} {m.kind}</td><td>{m.name}</td>
              <td><input className="cell" type="number" defaultValue={m.stock} key={m.stock} onBlur={e => Number(e.target.value) !== m.stock && mats.update(m.id, { stock: Number(e.target.value) }, `modificar ${m.kind} ${m.name}`)} /></td>
              <td><Del onClick={() => mats.remove(m.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Ingreso / Consumo</h2>
      <form className="card row" onSubmit={submitMove}>
        <select className={`tone ${MV_TONE[mv.kind]}`} value={mv.kind} onChange={e => setMv({ ...mv, kind: e.target.value as DrugMaterialMove['kind'] })}>
          <option value="ingreso" className="good">Ingreso</option><option value="consumo" className="bad">Consumo</option>
        </select>
        <select value={mv.material} onChange={e => setMv({ ...mv, material: e.target.value })} required>
          <option value="">Semilla / hoja…</option>
          {mats.rows.map(m => <option key={m.id} value={m.id}>{MAT_EMOJI[m.kind]} {m.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={mv.qty} onChange={e => setMv({ ...mv, qty: e.target.value })} />
        <input placeholder="Notas (opcional)" value={mv.note} onChange={e => setMv({ ...mv, note: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial de ingreso y consumo</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Material</th><th>Cant.</th><th /><th /></tr></thead>
        <tbody>
          {moves.rows.length === 0 && <Empty cols={7} />}
          {moves.rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td>
              <td><span className={`tag ${MV_TONE[r.kind]}`}>{r.kind === 'ingreso' ? 'Ingreso' : 'Consumo'}</span></td>
              <td>{userName(r.user_id)}</td><td>{matLabel(r.material_id)}</td>
              <td className={`amt ${MV_TONE[r.kind]}`}>{r.kind === 'ingreso' ? '+' : '−'}{r.qty}</td>
              <td><Info text={r.note || 'Sin notas'} /></td>
              <td><Del onClick={() => removeMove(r)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function DrogasHechas() {
  const { user, userName } = useSession()
  const drugs = useTable<Drug>('drugs', 'name', true)
  const sales = useTable<DrugSale>('drug_sales')
  const [form, setForm] = useState({ name: '', emoji: DRUG_EMOJIS[0], craft_cost: '', sell_price: '' })
  const [move, setMove] = useState({ drug: '', qty: '', mode: 'ingreso' as 'ingreso' | 'venta', money: 'limpio' as MoneyType })

  const drugName = (id: string) => drugs.rows.find(d => d.id === id)?.name ?? '—'
  const stockValue = drugs.rows.reduce((a, d) => a + d.stock * d.sell_price, 0)

  const num = (id: string, field: 'stock' | 'craft_cost' | 'sell_price', v: string) =>
    drugs.update(id, { [field]: Number(v) } as Partial<Drug>, `modificar valor (${field})`)

  const removeSale = (s: DrugSale) => {
    const d = drugs.rows.find(x => x.id === s.drug_id)
    if (d) {
      const patch = s.kind === 'ingreso' ? { stock: d.stock - s.qty } : { stock: d.stock + s.qty, sold: Math.max(0, d.sold - s.qty) }
      void drugs.update(d.id, patch, `revertir ${s.kind} de ${d.name} x${s.qty}`)
    }
    void sales.remove(s.id)
  }

  const submitMove = (e: React.FormEvent) => {
    e.preventDefault()
    const d = drugs.rows.find(x => x.id === move.drug)
    const qty = Number(move.qty)
    if (!d || !user || qty <= 0) return
    if (move.mode === 'ingreso') {
      void drugs.update(d.id, { stock: d.stock + qty }, `ingreso droga: ${d.name} x${qty}`)
      void sales.insert({ user_id: user.id, drug_id: d.id, kind: 'ingreso', qty, unit_price: d.craft_cost }, `ingreso: ${d.name} x${qty}`)
    } else {
      if (qty > d.stock && !confirm('No hay stock suficiente, ¿registrar igualmente?')) return
      void drugs.update(d.id, { stock: d.stock - qty, sold: d.sold + qty }, `venta droga: ${d.name} x${qty}`)
      void sales.insert({ user_id: user.id, drug_id: d.id, kind: 'venta', money_type: move.money, qty, unit_price: d.sell_price }, `venta: ${d.name} x${qty}`)
    }
    setMove({ ...move, qty: '' })
  }

  return (
    <>
      <section className="stats stack">
        <Stat label="💰 Valor estimado en venta" value={money(stockValue)} />
        {drugs.rows.map(d => <Stat key={d.id} label={`${d.emoji} ${d.name}`} value={`${d.stock} en stock`} />)}
      </section>

      <h2>Tabla de valores</h2>
      <table>
        <thead><tr><th>Droga</th><th>Inventario</th><th>Vendidas</th><th>Coste creación</th><th>Precio venta</th><th>Ganancia</th><th /></tr></thead>
        <tbody>
          {drugs.rows.length === 0 && <Empty cols={7} />}
          {drugs.rows.map(d => (
            <tr key={d.id}>
              <td>
                <select value={d.emoji} title="Cambiar emoji" onChange={e => drugs.update(d.id, { emoji: e.target.value }, `cambiar emoji de ${d.name}`)}>
                  {DRUG_EMOJIS.map(em => <option key={em}>{em}</option>)}
                </select> {d.name}
              </td>
              <td><input className="cell" type="number" defaultValue={d.stock} key={'s' + d.stock} onBlur={e => Number(e.target.value) !== d.stock && num(d.id, 'stock', e.target.value)} /></td>
              <td>{d.sold}</td>
              <td><input className="cell" type="number" defaultValue={d.craft_cost} onBlur={e => Number(e.target.value) !== d.craft_cost && num(d.id, 'craft_cost', e.target.value)} /></td>
              <td><input className="cell" type="number" defaultValue={d.sell_price} onBlur={e => Number(e.target.value) !== d.sell_price && num(d.id, 'sell_price', e.target.value)} /></td>
              <td>{money(d.sell_price - d.craft_cost)}</td>
              <td><Del onClick={() => drugs.remove(d.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!form.name.trim()) return
        void drugs.insert({ name: form.name.trim(), emoji: form.emoji, craft_cost: Number(form.craft_cost) || 0, sell_price: Number(form.sell_price) || 0 }, 'añadir tipo de droga')
        setForm({ ...form, name: '', craft_cost: '', sell_price: '' })
      }}>
        <select value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} title="Emoji">
          {DRUG_EMOJIS.map(em => <option key={em}>{em}</option>)}
        </select>
        <input placeholder="Nueva droga" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="number" placeholder="Coste creación" value={form.craft_cost} onChange={e => setForm({ ...form, craft_cost: e.target.value })} />
        <input type="number" placeholder="Precio venta" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} />
        <button>Añadir droga</button>
      </form>

      <h2>Ingreso/Venta</h2>
      <form className="card row" onSubmit={submitMove}>
        <select className={`tone ${move.mode === 'ingreso' ? 'good' : 'bad'}`} value={move.mode} onChange={e => setMove({ ...move, mode: e.target.value as 'ingreso' | 'venta' })}>
          <option value="ingreso" className="good">Ingreso</option><option value="venta" className="bad">Venta</option>
        </select>
        <select value={move.drug} onChange={e => setMove({ ...move, drug: e.target.value })} required>
          <option value="">Droga…</option>
          {drugs.rows.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
        </select>
        {move.mode === 'venta' && <MoneySelect value={move.money} onChange={v => setMove({ ...move, money: v })} />}
        <input type="number" min="1" placeholder="Cantidad" value={move.qty} onChange={e => setMove({ ...move, qty: e.target.value })} />
        <button>Registrar</button>
      </form>

      <h2>Historial de Ingreso/Venta</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Droga</th><th>Cant.</th><th>Precio u.</th><th>Total</th><th>Dinero</th><th /></tr></thead>
        <tbody>
          {sales.rows.length === 0 && <Empty cols={9} />}
          {sales.rows.map(s => (
            <tr key={s.id}>
              <td>{dateTime(s.created_at)}</td><td><span className={`tag ${s.kind === 'ingreso' ? 'good' : 'bad'}`}>{s.kind === 'ingreso' ? 'Ingreso' : 'Venta'}</span></td><td>{userName(s.user_id)}</td><td>{drugName(s.drug_id)}</td>
              <td>{s.qty}</td><td>{money(s.unit_price)}</td><td>{s.kind === 'venta' ? money(s.qty * s.unit_price) : '—'}</td><td>{s.kind === 'venta' ? <MoneyTag type={s.money_type} /> : '—'}</td><td><Del onClick={() => removeSale(s)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
