import { useState } from 'react'
import { ItemStock } from '../components/ItemStock'

type Tab = 'stock' | 'fabricacion'

export default function Herramientas() {
  const [tab, setTab] = useState<Tab>('stock')
  return (
    <>
      <div className="tabs left" role="tablist">
        <button role="tab" aria-selected={tab === 'stock'} className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>📦 Stock</button>
        <button role="tab" aria-selected={tab === 'fabricacion'} className={tab === 'fabricacion' ? 'active' : ''} onClick={() => setTab('fabricacion')}>🛠️ Fabricación</button>
      </div>
      {tab === 'stock'
        ? <ItemStock key="tools" itemsTable="tools" movesTable="tool_moves" emoji="🧰" noun="herramienta" title="Herramientas" />
        : <ItemStock key="parts" itemsTable="tool_parts" movesTable="tool_part_moves" emoji="⚙️" noun="pieza" title="Piezas" />}
    </>
  )
}
