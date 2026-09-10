import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const items = [
  { to: '/home', label: 'HOME', icon: 'home' },
  { to: '/sales', label: 'SALES', icon: 'sales' },
  { to: '/inventory', label: 'INVENTORY', icon: 'inventory' },
  { to: '/reports', label: 'REPORTS', icon: 'reports' }
]

const icons: Record<string, React.ReactNode> = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" /></svg>,
  sales: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 7.5h12M6 12h12M6 16.5h8" /><path d="M18 16.5h.01" /></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Zm0 3 8 4.5 8-4.5M4 15l8 4.5 8-4.5" /></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M5 19V9m7 10V5m7 14v-8" /></svg>
}

export default function BottomNav() {
  const [toolsOpen, setToolsOpen] = useState(false)
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[22px] border border-[#e3efec] bg-white/95 p-2 shadow-[0_20px_40px_rgba(10,40,35,0.12)] backdrop-blur md:hidden">
      {toolsOpen && <div className="mb-2 grid grid-cols-2 gap-2 border-b border-[#e3efec] pb-2">
        <NavLink to="/orders" onClick={() => setToolsOpen(false)} className="rounded-xl bg-[#f1faf7] px-2 py-2 text-center text-[11px] font-bold text-[#0f6b63]">User Query</NavLink>
        <NavLink to="/expenses" onClick={() => setToolsOpen(false)} className="rounded-xl bg-[#f1faf7] px-2 py-2 text-center text-[11px] font-bold text-[#0f6b63]">Expenses</NavLink>
      </div>}
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold tracking-[0.08em] ${
                isActive ? 'bg-[#eafaf5] text-[#0f6b63]' : 'text-slate-500'
              }`
            }
          >
            <span className="mb-1">{icons[item.icon]}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" onClick={() => setToolsOpen((open) => !open)} className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold tracking-[0.08em] ${toolsOpen ? 'bg-[#eafaf5] text-[#0f6b63]' : 'text-slate-500'}`}>
          <span className="mb-1 text-base">+</span><span>TOOLS</span>
        </button>
      </div>
    </nav>
  )
}
