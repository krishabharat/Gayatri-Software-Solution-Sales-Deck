import { NavLink } from 'react-router-dom'
import { AIChatBotIcon, InventoryCycleIcon, SalesTagIcon } from '../Icons/AppIcons'

const navItems = [
  { to: '/home', label: 'HOME', icon: 'home' },
  { to: '/ai-chat', label: 'AI CHAT', icon: 'aichat', badge: 'GEMINI' },
  { to: '/sales', label: 'SALES', icon: 'sales' },
  { to: '/inventory', label: 'INVENTORY', icon: 'inventory' },
  { to: '/orders', label: 'CUSTOMER QUERIES', icon: 'orders' },
  { to: '/expenses', label: 'EXPENSES', icon: 'expenses' },
  { to: '/customers', label: 'CUSTOMERS', icon: 'customers' },
  { to: '/suppliers', label: 'SUPPLIERS', icon: 'suppliers' },
  { to: '/reports', label: 'REPORTS', icon: 'reports' }
]

const iconMap: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" /></svg>
  ),
  aichat: <AIChatBotIcon className="h-4 w-4" />,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0M16 11a3 3 0 0 1 5 2.2M17 19h4" /></svg>,
  suppliers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="M4 8h16v12H4zM7 8V5h10v3M8 12h8M8 16h5" /></svg>,
  sales: <SalesTagIcon className="h-4 w-4" />,
  inventory: <InventoryCycleIcon className="h-4 w-4" />,
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="M5 19V9m7 10V5m7 14v-8" /></svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="M6 5h12v14H6z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
  ),
  expenses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4"><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12h8M12 10v4" /></svg>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden w-[262px] flex-col rounded-[26px] border border-[#E6D7C3] bg-[#FFFDF9] px-4 py-6 text-[#3B2314] shadow-[0_12px_36px_-10px_rgba(59,35,20,0.08)] md:mr-3 md:flex">
      {/* Bright Cream Header so Logo & Text are 100% Crisp and Visible */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#EFE3D2] bg-[#FAF5EE] p-3">
        <img src="/brand-mark.png" alt="Sai Gayatri logo" className="h-11 w-11 object-contain" />
        <div>
          <div className="text-xs font-extrabold tracking-[0.14em] text-[#2B1810]">SAI GAYATRI</div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#B46528]">INDUSTRIES</div>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150 tracking-wide ${
                isActive
                  ? 'bg-gradient-to-r from-[#5C3317] to-[#B46528] text-white shadow-md shadow-[#5C3317]/20'
                  : 'text-[#5C3317] hover:bg-[#FAF5EE] hover:text-[#2B1810]'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg">
                {iconMap[item.icon]}
              </span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="rounded-md bg-[#F3E6D5] px-1.5 py-0.5 text-[9px] font-extrabold text-[#8C4A1F] border border-[#D9C3A8]">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-[#E6D7C3] bg-[#FAF5EE] p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C4A1F]">Gemini + Supabase</div>
        </div>
        <div className="mt-1 text-xs font-bold text-[#2B1810]">Live AI Brain Active</div>
        <p className="mt-0.5 text-[11px] font-medium text-[#7A5C48]">Real-time SQL & RAG sync</p>
      </div>
    </aside>
  )
}
