import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime, money } from '../lib/format'
import type { Heist } from '../lib/types'
import { Del, Empty, NoteCell, MoneyTag, Stat, UserMultiSelect } from '../components/ui'

type LootType = Heist['loot_type']
const LOOT_ITEMS = [
  { value: 'armas', label: '🔫 Armas' },
  { value: 'chatarra', label: '🔩 Chatarra' },
  { value: 'plastico', label: '🧴 Plástico' },
  { value: 'polvora', label: '💥 Pólvora' },
]
const itemLabel = (v: string) => LOOT_ITEMS.find(i => i.value === v)?.label ?? v

export default function Atracos() {
  const { users, user, userName } = useSession()
  const heists = useTable<Heist>('heists')
  const [h, setH] = useState({ name: '', loot: '', loot_type: 'limpio' as LootType, loot_item: LOOT_ITEMS[0].value, participants: [] as string[], weapons_used: '', note: '' })

  const moneyTotal = (t: LootType) => heists.rows.filter(r => (r.loot_type ?? 'limpio') === t).reduce((a, r) => a + Number(r.loot), 0)

  return (
    <>
      {heists.error && <p className="error">{heists.error}</p>}
      <section className="stats">
        <Stat label="💎 Atracos" value={heists.rows.length} />
        <Stat label="💵 Botín total (dinero limpio)" value={money(moneyTotal('limpio'))} tone="good" />
        <Stat label="🖤 Botín total (dinero negro)" value={money(moneyTotal('negro'))} tone="good" />
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!h.name.trim()) return
        const materials = h.loot_type === 'materiales'
        void heists.insert({ user_id: user?.id ?? null, name: h.name.trim(), loot: materials ? 0 : Number(h.loot) || 0, loot_type: h.loot_type, loot_item: materials ? h.loot_item : '', participants: h.participants.join(', '), weapons_used: h.weapons_used, note: h.note }, `registrar atraco: ${h.name}`)
        setH({ ...h, name: '', loot: '', participants: [], weapons_used: '', note: '' })
      }}>
        <input placeholder="Atraco (ej. Joyería)" value={h.name} onChange={e => setH({ ...h, name: e.target.value })} />
        <select title="Tipo de botín" value={h.loot_type} onChange={e => setH({ ...h, loot_type: e.target.value as LootType })}>
          <option value="limpio">💵 Dinero limpio</option>
          <option value="negro">🖤 Dinero negro</option>
          <option value="materiales">📦 Materiales</option>
        </select>
        {h.loot_type === 'materiales' && (
          <select title="Material conseguido" value={h.loot_item} onChange={e => setH({ ...h, loot_item: e.target.value })}>
            {LOOT_ITEMS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        )}
        {h.loot_type !== 'materiales' && <input type="number" min="0" placeholder="Botín" value={h.loot} onChange={e => setH({ ...h, loot: e.target.value })} />}
        <UserMultiSelect users={users} value={h.participants} onChange={v => setH({ ...h, participants: v })} />
        <input placeholder="Armas usadas" value={h.weapons_used} onChange={e => setH({ ...h, weapons_used: e.target.value })} />
        <input placeholder="Nota" value={h.note} onChange={e => setH({ ...h, note: e.target.value })} />
        <button>Registrar</button>
      </form>
      <table>
        <thead><tr><th>Fecha</th><th>Registrado por</th><th>Atraco</th><th>Botín</th><th>Tipo de botín</th><th>Participantes</th><th>Armas</th><th>Nota</th><th /></tr></thead>
        <tbody>
          {heists.rows.length === 0 && <Empty cols={9} />}
          {heists.rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td><td>{userName(r.user_id)}</td><td>{r.name}</td>
              <td>{r.loot_type === 'materiales' ? itemLabel(r.loot_item) : money(r.loot)}</td>
              <td>{r.loot_type === 'materiales' ? <span className="tag warn">📦 Materiales</span> : <MoneyTag type={r.loot_type} />}</td>
              <td>{r.participants}</td><td>{r.weapons_used}</td><td><NoteCell value={r.note} onSave={note => heists.update(r.id, { note }, 'editar nota')} /></td><td><Del onClick={() => heists.remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
