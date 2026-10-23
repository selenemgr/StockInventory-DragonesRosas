import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { MoneyType } from '../lib/moneyType'
import type { Drug, DrugSale, Finance, Fine, Heist, House, Weapon, WeaponMove } from '../lib/types'
import { Del, Empty, MoneySelect, MoneyTag, Stat } from '../components/ui'

const TYPES: Finance['type'][] = ['ingreso', 'retiro', 'inversion']
const TONE: Record<Finance['type'], string> = { deposito: 'good', ingreso: 'good', retiro: 'bad', gasto: 'bad', inversion: 'warn' }

export default function Finanzas() {
  const { user, userName } = useSession()
  const { rows, error, insert, remove } = useTable<Finance>('finance')
  const sales = useTable<DrugSale>('drug_sales')
  const drugs = useTable<Drug>('drugs', 'name', true)
  const weapons = useTable<Weapon>('weapons')
  const heists = useTable<Heist>('heists')
  const houses = useTable<House>('houses')
  const fines = useTable<Fine>('fines')
  const weaponMoves = useTable<WeaponMove>('weapon_moves')
  const [type, setType] = useState<Finance['type']>('ingreso')
  const [moneyType, setMoneyType] = useState<MoneyType>('limpio')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const sum = (t: Finance['type'][]) => rows.filter(r => t.includes(r.type)).reduce((a, r) => a + Number(r.amount), 0)
  const ventasDroga = sales.rows.filter(s => s.kind === 'venta').reduce((a, s) => a + s.qty * Number(s.unit_price), 0)
  // Armas: solo las ventas afectan a las finanzas
  const priced = weaponMoves.rows.filter(m => m.kind === 'venta')
  const ventasArmas = priced.reduce((a, m) => a + m.qty * Number(m.unit_price), 0)
  // Atracos: solo el botín en dinero (limpio o negro) afecta a las finanzas
  const heistMoney = heists.rows.filter(r => r.loot_type === 'limpio' || r.loot_type === 'negro')
  const ventasAtracos = heistMoney.reduce((a, r) => a + Number(r.loot), 0)
  const ingresosCasas = houses.rows.reduce((a, r) => a + Number(r.loot), 0)
  // Multas: las multas marcadas como pagadas restan de la caja de dinero limpio
  const paidFines = fines.rows.filter(f => f.kind === 'multa' && f.paid)
  const multasPagadas = paidFines.reduce((a, f) => a + Number(f.amount), 0)
  const metido = sum(['deposito', 'ingreso'])
  const invertido = sum(['inversion'])
  const salido = sum(['retiro', 'gasto'])

  type Source = 'finance' | 'drug' | 'weapon' | 'heist' | 'house' | 'fine'
  type Row = { id: string; created_at: string; user_id: string; type: Finance['type'] | 'venta droga' | 'venta arma' | 'atraco' | 'casas' | 'multa pagada'; amount: number; note: string; source: Source; money_type: MoneyType }
  const weaponName = (id: string) => weapons.rows.find(w => w.id === id)?.name ?? 'Arma'
  const drugName = (id: string) => { const d = drugs.rows.find(x => x.id === id); return d ? `${d.emoji} ${d.name}` : 'droga eliminada' }
  const history: Row[] = [
    ...rows.map(r => ({ ...r, source: 'finance' as Source })),
    ...sales.rows.filter(s => s.kind === 'venta').map(s => ({
      id: s.id, created_at: s.created_at, user_id: s.user_id, type: 'venta droga' as const, amount: s.qty * Number(s.unit_price),
      note: `Venta de ${drugName(s.drug_id)} x${s.qty}`, source: 'drug' as Source, money_type: s.money_type,
    })),
    ...priced.map(m => ({
      id: m.id, created_at: m.created_at, user_id: m.user_id, type: 'venta arma' as const, amount: m.qty * Number(m.unit_price),
      note: `${weaponName(m.weapon_id)} x${m.qty}${m.note ? ` — ${m.note}` : ''}`, source: 'weapon' as Source, money_type: m.money_type,
    })),
    ...heistMoney.map(r => ({
      id: r.id, created_at: r.created_at, user_id: r.user_id ?? '', type: 'atraco' as const, amount: Number(r.loot),
      note: `${r.name}${r.participants ? ` (${r.participants})` : ''}`, source: 'heist' as Source, money_type: r.loot_type as MoneyType,
    })),
    ...houses.rows.map(r => ({
      id: r.id, created_at: r.created_at, user_id: r.user_id ?? '', type: 'casas' as const, amount: Number(r.loot),
      note: `${r.qty} ${Number(r.qty) === 1 ? 'casa' : 'casas'}${r.note ? ` — ${r.note}` : ''}`, source: 'house' as Source, money_type: 'limpio' as MoneyType,
    })),
    ...paidFines.map(f => ({
      id: f.id, created_at: f.created_at, user_id: f.user_id, type: 'multa pagada' as const, amount: Number(f.amount),
      note: f.reason || 'Multa pagada', source: 'fine' as Source, money_type: 'limpio' as MoneyType,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const cajaDe = (mt: MoneyType) => history.filter(r => (r.money_type ?? 'limpio') === mt).reduce((a, r) => a + (r.source === 'fine' || (r.source === 'finance' && ['retiro', 'gasto', 'inversion'].includes(r.type)) ? -1 : 1) * Number(r.amount), 0)
  const cajaLimpio = cajaDe('limpio')
  const cajaNegro = cajaDe('negro')
  /** Elimina el registro de origen y revierte su efecto (stock de droga/arma). Finanzas se recalcula sola. */
  const removeRow = (r: Row) => {
    if (r.source === 'finance') return remove(r.id)
    if (r.source === 'heist') return heists.remove(r.id)
    if (r.source === 'house') return houses.remove(r.id)
    if (r.source === 'fine') return fines.remove(r.id)
    if (r.source === 'drug') {
      const s = sales.rows.find(x => x.id === r.id)
      const d = s && drugs.rows.find(x => x.id === s.drug_id)
      if (s && d) void drugs.update(d.id, { stock: d.stock + s.qty, sold: Math.max(0, d.sold - s.qty) }, `revertir venta de ${d.name} x${s.qty}`)
      return sales.remove(r.id)
    }
    const m = weaponMoves.rows.find(x => x.id === r.id)
    const w = m && weapons.rows.find(x => x.id === m.weapon_id)
    if (m && w) void weapons.update(w.id, { stock: w.stock + m.qty }, `revertir venta de ${w.name} x${m.qty}`)
    return weaponMoves.remove(r.id)
  }
  const SOURCE_TONE: Partial<Record<Row['type'], string>> = { 'venta droga': 'violet', 'venta arma': 'cyan', atraco: 'orange', casas: 'blue', 'multa pagada': 'rose' }
  const tone = (t: Row['type']) => SOURCE_TONE[t] ?? TONE[t as Finance['type']]
  const SOURCE_LABEL: Record<Source, string> = { finance: '', drug: '🌿 ', weapon: '🔫 ', heist: '💎 ', house: '🏠 ', fine: '🚔 ' }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="stats-split">
        <section className="stats stack">
        <Stat label="📥 Dinero Ingresado" value={money(metido)} tone="good" />
        <Stat label="📈 Invertido" value={money(invertido)} tone="warn" />
        <Stat label="📤 Retirado" value={money(salido)} tone="bad" />
        <Stat label="💵 Dinero limpio" value={money(cajaLimpio)} tone={cajaLimpio >= 0 ? 'deep' : 'bad'} />
        <Stat label="🖤 Dinero negro" value={money(cajaNegro)} tone={cajaNegro >= 0 ? 'deep' : 'bad'} />
        </section>
        <section className="stats stack">
        <Stat label="🌿 Ingresos por venta de droga" value={money(ventasDroga)} tone="violet" />
        <Stat label="🔫 Ingresos por venta de armas" value={money(ventasArmas)} tone="cyan" />
        <Stat label="💎 Ingresos por atracos" value={money(ventasAtracos)} tone="orange" />
        <Stat label="🏠 Ingresos por casas" value={money(ingresosCasas)} tone="blue" />
        <Stat label="🚔 Multas pagadas" value={money(multasPagadas)} tone="rose" />
        </section>
      </div>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!user || !Number(amount)) return
        void insert({ user_id: user.id, type, money_type: moneyType, amount: Number(amount), note }, `finanzas: ${type}`)
        setAmount(''); setNote('')
      }}>
        <select className={`tone ${TONE[type]}`} value={type} onChange={e => setType(e.target.value as Finance['type'])}>
          {TYPES.map(t => <option key={t} value={t} className={TONE[t]}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <MoneySelect value={moneyType} onChange={setMoneyType} />
        <input type="number" min="0" placeholder="Cantidad" value={amount} onChange={e => setAmount(e.target.value)} />
        <input placeholder="Nota" value={note} onChange={e => setNote(e.target.value)} />
        <button>Registrar</button>
      </form>

      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Tipo</th><th>Dinero</th><th>Cantidad</th><th>Nota</th><th /></tr></thead>
        <tbody>
          {history.length === 0 && <Empty cols={7} />}
          {history.map(r => (
            <tr key={r.source + r.id}>
              <td>{dateTime(r.created_at)}</td><td>{userName(r.user_id)}</td><td><span className={`tag ${tone(r.type)}`}>{SOURCE_LABEL[r.source]}{r.type}</span></td>
              <td><MoneyTag type={r.money_type} /></td>
              <td className={`amt ${tone(r.type)}`}>{money(r.amount)}</td><td>{r.note}</td><td><Del onClick={() => removeRow(r)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
