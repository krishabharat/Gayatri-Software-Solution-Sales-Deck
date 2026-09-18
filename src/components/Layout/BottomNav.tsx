import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', label: 'HOME', icon: 'home' },
  { to: '/sales', label: 'SALES', icon: 'sales' },
  { to: '/inventory', label: 'INVENTORY', icon: 'inventory' },
  { to: '/orders', label: 'QUERIES', icon: 'orders' },
  { to: '/expenses', label: 'EXPENSES', icon: 'expenses' },
  { to: '/customers', label: 'CUSTOMERS', icon: 'customers' },
  { to: '/suppliers', label: 'SUPPLIERS', icon: 'suppliers' },
  { to: '/reports', label: 'REPORTS', icon: 'reports' }
]

const icons: Record<string, React.ReactNode> = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" /></svg>,
  sales: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 7.5h12M6 12h12M6 16.5h8" /><path d="M18 16.5h.01" /></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Zm0 3 8 4.5 8-4.5M4 15l8 4.5 8-4.5" /></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M5 19V9m7 10V5m7 14v-8" /></svg>
  ,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 5h12v14H6z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>,
  expenses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12h8M12 10v4" /></svg>
  ,
  customers: <span className="text-sm">C</span>,
  suppliers: <span className="text-sm">S</span>
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[22px] border border-[#e3efec] bg-white/95 p-2 shadow-[0_20px_40px_rgba(10,40,35,0.12)] backdrop-blur md:hidden">
      <div className="flex min-w-max gap-1 overflow-x-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-[68px] flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold tracking-[0.08em] ${
                isActive ? 'bg-[#eafaf5] text-[#0f6b63]' : 'text-slate-500'
              }`
            }
          >
            <span className="mb-1">{icons[item.icon]}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
