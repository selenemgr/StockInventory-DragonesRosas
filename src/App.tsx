import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './context/Session'
import { configured } from './lib/supabase'
import Login from './pages/Login'
import Finanzas from './pages/Finanzas'
import Drogas from './pages/Drogas'
import Armas from './pages/Armas'
import Herramientas from './pages/Herramientas'
import Atracos from './pages/Atracos'
import Casas from './pages/Casas'
import Tratos from './pages/Tratos'
import Materiales from './pages/Materiales'
import Multas from './pages/Multas'
import Inventario from './pages/Inventario'
import Logs from './pages/Logs'

const tabs = [
  ['/finanzas', '💰 Finanzas'],
  ['/drogas', '🌿 Drogas'],
  ['/armas', '🔫 Armas'],
  ['/herramientas', '🧰 Herramientas'],
  ['/atracos', '💎 Atracos'],
  ['/casas', '🏠 Casas'],
  ['/tratos', '🤝 Tratos'],
  ['/materiales', '♻️ Materiales'],
  ['/multas', '🚔 Multas'],
  ['/inventario', '🎒 Inventario'],
  ['/logs', '📜 Logs'],
]

export default function App() {
  const { user, logout } = useSession()

  if (!configured)
    return (
      <div className="login card">
        <h1>🐉 Dragones Rosas</h1>
        <p>Falta configurar Supabase. Copia <code>.env.example</code> a <code>.env</code> y rellena las claves (ver README).</p>
      </div>
    )

  if (!user) return <Login />

  return (
    <>
      <header>
        <h1>🐉 Dragones Rosas</h1>
        <nav>
          {tabs.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <div className="who">
          <span>👤 {user.name}</span>
          <button className="ghost" onClick={logout}>Cambiar</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/drogas" element={<Drogas />} />
          <Route path="/armas" element={<Armas />} />
          <Route path="/herramientas" element={<Herramientas />} />
          <Route path="/atracos" element={<Atracos />} />
          <Route path="/casas" element={<Casas />} />
          <Route path="/tratos" element={<Tratos />} />
          <Route path="/materiales" element={<Materiales />} />
          <Route path="/multas" element={<Multas />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="*" element={<Navigate to="/finanzas" replace />} />
        </Routes>
      </main>
    </>
  )
}
