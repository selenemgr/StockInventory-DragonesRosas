import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MONEY_TYPES, type MoneyType } from '../lib/moneyType'

export const Stat = ({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) => (
  <div className={`stat ${tone ?? ''}`}><span>{label}</span><strong>{value}</strong></div>
)

export const Del = ({ onClick }: { onClick: () => void }) => (
  <button className="ghost danger" title="Eliminar" onClick={() => confirm('¿Eliminar?') && onClick()}>✕</button>
)

export const Empty = ({ cols }: { cols: number }) => (
  <tr><td colSpan={cols} className="empty">Sin registros</td></tr>
)

export function UserSelect({ value, onChange, users }: { value: string; onChange: (v: string) => void; users: { id: string; name: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} required>
      <option value="">Usuario…</option>
      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select>
  )
}

/** Icono ⓘ que muestra un texto al pasar el mouse (posición fija para no recortarse en tablas con scroll). */
export function Info({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        className="info"
        onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.bottom + 6 }) }}
        onMouseLeave={() => setPos(null)}
      >i</span>
      {pos && <div className="info-tip" style={{ left: pos.x, top: pos.y }}>{text}</div>}
    </>
  )
}

/** Selector múltiple de usuarios (lista desplegable con casillas). */
export function UserMultiSelect({ value, onChange, users }: { value: string[]; onChange: (v: string[]) => void; users: { id: string; name: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter(n => n !== name) : [...value, name])
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <details className="multi" ref={ref}>
      <summary>{value.length ? value.join(', ') : 'Participantes…'}</summary>
      <div className="multi-list">
        {users.length === 0 && <span className="muted">No hay miembros</span>}
        {users.map(u => (
          <label key={u.id}><input type="checkbox" checked={value.includes(u.name)} onChange={() => toggle(u.name)} /> {u.name}</label>
        ))}
      </div>
    </details>
  )
}

export function MoneySelect({ value, onChange, title = 'Tipo de dinero' }: { value: MoneyType; onChange: (v: MoneyType) => void; title?: string }) {
  return (
    <select title={title} value={value} onChange={e => onChange(e.target.value as MoneyType)}>
      {(Object.keys(MONEY_TYPES) as MoneyType[]).map(m => <option key={m} value={m}>{MONEY_TYPES[m].emoji} {MONEY_TYPES[m].label}</option>)}
    </select>
  )
}

export const MoneyTag = ({ type }: { type: MoneyType }) => (
  <span className={`tag ${MONEY_TYPES[type ?? 'limpio'].cls}`}>{MONEY_TYPES[type ?? 'limpio'].emoji} {MONEY_TYPES[type ?? 'limpio'].label}</span>
)
