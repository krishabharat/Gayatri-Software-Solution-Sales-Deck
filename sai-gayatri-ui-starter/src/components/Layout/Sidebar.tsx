import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/home', label: 'HOME', icon: 'home' },
  { to: '/sales', label: 'SALES', icon: 'sales' },
  { to: '/inventory', label: 'INVENTORY', icon: 'inventory' },
  { to: '/reports', label: 'REPORTS', icon: 'reports' }
]

const iconMap: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" /></svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 7.5h12M6 12h12M6 16.5h8" /><path d="M18 16.5h.01" /></svg>
  ),
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Zm0 3 8 4.5 8-4.5M4 15l8 4.5 8-4.5" /></svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M5 19V9m7 10V5m7 14v-8" /></svg>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden w-[260px] flex-col border-r border-[#eadff2] bg-[#f9f4ff]/95 px-5 py-6 backdrop-blur md:flex">
      <div className="mb-8 ml-1 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#412653] text-lg font-bold text-white shadow-[0_10px_20px_rgba(65,38,83,0.25)]">
          SG
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.22em] text-[#5e4d6d]">SAI GAYATRI</div>
          <div className="text-[10px] font-semibold tracking-[0.22em] text-[#412653]">INDUSTRIES</div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#f1e7ff] text-[#412653] shadow-sm'
                  : 'text-slate-600 hover:bg-[#f7f1ff] hover:text-slate-800'
              }`
            }
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#412653] shadow-sm">
              {iconMap[item.icon]}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-[#eadff2] bg-[#f5ecff] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6a5d7b]">Operations</div>
        <div className="mt-2 text-sm font-semibold text-[#2d1739]">Industrial service control</div>
      </div>
    </aside>
  )
}
