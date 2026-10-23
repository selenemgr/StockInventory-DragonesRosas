import { useState } from 'react'
import { useSession } from '../context/Session'

type Tab = 'select' | 'add'

export default function Login() {
  const { users, login, addUser } = useSession()
  const [tab, setTab] = useState<Tab>('select')
  const [name, setName] = useState('')

  return (
    <div className="login card">
      <h1>🐉 Dragones Rosas</h1>
      <p>¿Quién eres?</p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'select'} className={tab === 'select' ? 'active' : ''} onClick={() => setTab('select')}>
          Seleccionar
        </button>
        <button role="tab" aria-selected={tab === 'add'} className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>
          Añadir miembro
        </button>
      </div>
      {tab === 'select' ? (
        <div className="user-list">
          {users.length === 0 && <p>No hay miembros todavía. Añade uno en la otra pestaña.</p>}
          {users.map(u => <button key={u.id} className="user-item" onClick={() => login(u)}>👤 {u.name}</button>)}
        </div>
      ) : (
        <form
          onSubmit={e => { e.preventDefault(); if (name.trim()) { void addUser(name.trim()); setName(''); setTab('select') } }}
          className="row"
        >
          <input placeholder="Nuevo miembro…" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <button>Añadir</button>
        </form>
      )}
    </div>
  )
}
