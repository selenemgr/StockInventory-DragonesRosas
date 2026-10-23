import { useState } from 'react'
import { useSession } from '../context/Session'
import { useTable } from '../lib/useTable'
import { dateTime } from '../lib/format'
import type { Material } from '../lib/types'
import { Del, Empty, NoteCell, Stat } from '../components/ui'

const MATERIALS: Record<Material['material'], { emoji: string; label: string }> = {
  chatarra: { emoji: '🔩', label: 'Chatarra' },
  plastico: { emoji: '🧴', label: 'Plástico' },
  polvora: { emoji: '💥', label: 'Pólvora' },
}
const TONE: Record<Material['kind'], string> = { ingreso: 'good', retiro: 'bad' }

export default function Materiales() {
  const { user, userName } = useSession()
  const { rows, error, insert, update, remove } = useTable<Material>('materials')
  const [kind, setKind] = useState<Material['kind']>('ingreso')
  const [material, setMaterial] = useState<Material['material']>('chatarra')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')

  const stock = (m: Material['material']) =>
    rows.filter(r => r.material === m).reduce((a, r) => a + (r.kind === 'ingreso' ? 1 : -1) * Number(r.qty), 0)

  return (
    <>
      {error && <p className="error">{error}</p>}
      <section className="stats">
        {(Object.keys(MATERIALS) as Material['material'][]).map(m => (
          <Stat key={m} label={`${MATERIALS[m].emoji} ${MATERIALS[m].label} en stock`} value={stock(m)} tone={stock(m) >= 0 ? 'good' : 'bad'} />
        ))}
      </section>

      <form className="card row" onSubmit={e => {
        e.preventDefault()
        if (!user || !Number(qty)) return
        void insert({ user_id: user.id, kind, material, qty: Number(qty), note }, `${kind} de ${material}`)
        setQty(''); setNote('')
      }}>
        <select className={`tone ${TONE[kind]}`} value={kind} onChange={e => setKind(e.target.value as Material['kind'])}>
          <option value="ingreso" className="good">Ingreso</option>
          <option value="retiro" className="bad">Retiro</option>
        </select>
        <select value={material} onChange={e => setMaterial(e.target.value as Material['material'])}>
          {(Object.keys(MATERIALS) as Material['material'][]).map(m => <option key={m} value={m}>{MATERIALS[m].emoji} {MATERIALS[m].label}</option>)}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={qty} onChange={e => setQty(e.target.value)} />
        <input placeholder="Notas (opcional)" value={note} onChange={e => setNote(e.target.value)} />
        <button>Registrar</button>
      </form>

      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Tipo</th><th>Material</th><th>Cantidad</th><th /><th /></tr></thead>
        <tbody>
          {rows.length === 0 && <Empty cols={7} />}
          {rows.map(r => (
            <tr key={r.id}>
              <td>{dateTime(r.created_at)}</td><td>{userName(r.user_id)}</td>
              <td><span className={`tag ${TONE[r.kind]}`}>{r.kind}</span></td>
              <td>{MATERIALS[r.material].emoji} {MATERIALS[r.material].label}</td>
              <td className={`amt ${TONE[r.kind]}`}>{r.kind === 'ingreso' ? '+' : '−'}{r.qty}</td>
              <td><NoteCell tooltip value={r.note} onSave={note => update(r.id, { note }, 'editar nota')} /></td>
              <td><Del onClick={() => remove(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
