import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const primaryItems = [
  { to: '/home', label: 'HOME', icon: 'home' },
  { to: '/ai-chat', label: 'AI CHAT', icon: 'aichat' },
  { to: '/sales', label: 'SALES', icon: 'sales' },
  { to: '/inventory', label: 'INVENTORY', icon: 'inventory' }
]

const toolItems = [
  ...primaryItems,
  { to: '/orders', label: 'CUSTOMER QUERIES', icon: 'orders' },
  { to: '/expenses', label: 'EXPENSES', icon: 'expenses' },
  { to: '/customers', label: 'CUSTOMERS', icon: 'customers' },
  { to: '/suppliers', label: 'SUPPLIERS', icon: 'suppliers' },
  { to: '/reports', label: 'REPORTS', icon: 'reports' }
]

const icons: Record<string, React.ReactNode> = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" /></svg>,
  aichat: <span className="text-sm">✨</span>,
  sales: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 7.5h12M6 12h12M6 16.5h8" /><path d="M18 16.5h.01" /></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Zm0 3 8 4.5 8-4.5M4 15l8 4.5 8-4.5" /></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M5 19V9m7 10V5m7 14v-8" /></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 5h12v14H6z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>,
  expenses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12h8M12 10v4" /></svg>,
  customers: <span className="text-sm">C</span>,
  suppliers: <span className="text-sm">S</span>
}

export default function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[60] bg-[#2B1810]/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[70] w-[min(86vw,320px)] transform border-r border-[#E6D7C3] bg-[#FFFDF9] px-5 py-6 shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/brand-mark.png" alt="" className="h-10 w-10 object-contain" />
            <div>
              <div className="text-xs font-extrabold tracking-[0.16em] text-[#2B1810]">SAI GAYATRI</div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-[#B46528]">INDUSTRIES</div>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6D7C3] text-[#6F452B] hover:bg-[#FAF5EE]"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          {toolItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#5C3317] to-[#B46528] text-white'
                    : 'text-[#5C3317] hover:bg-[#FAF5EE] hover:text-[#2B1810]'
                }`
              }
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF5EE] text-[#5C3317]">
                {icons[item.icon]}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#E6D7C3] bg-[#FFFDF9]/95 px-2 py-2 backdrop-blur md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-bold tracking-wider transition ${
                isActive ? 'text-[#8C4A1F]' : 'text-[#7A5C48] hover:text-[#2B1810]'
              }`
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF5EE]">
              {icons[item.icon]}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-bold tracking-wider text-[#7A5C48]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF5EE]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </span>
          <span>MENU</span>
        </button>
      </nav>
    </>
  )
}
