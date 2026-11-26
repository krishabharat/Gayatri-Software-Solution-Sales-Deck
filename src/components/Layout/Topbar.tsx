import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { AIChatBotIcon, InventoryCycleIcon, SalesTagIcon } from '../Icons/AppIcons'

const titleMap: Record<string, string> = {
  '/home': 'Business Overview',
  '/categories': 'All Categories & Tools',
  '/ai-chat': 'AI Chart & Gemini',
  '/sales': 'Sales',
  '/sales/new': 'New Sale',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Stock',
  '/inventory/product-master': 'Product Master',
  '/reports': 'Reports',
  '/orders': 'Customer Queries',
  '/expenses': 'Expenses',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers'
}

const mobileQuickIcons: Array<{
  to: string
  label: string
  icon: React.ReactNode
  match: string[]
}> = [
  { to: '/sales', label: 'Sales', icon: <SalesTagIcon className="h-4 w-4" />, match: ['/sales', '/sales/new'] },
  { to: '/customers', label: 'Users', icon: <span className="text-sm leading-none">👤</span>, match: ['/customers', '/suppliers'] },
  { to: '/inventory', label: 'Inventory', icon: <InventoryCycleIcon className="h-4 w-4" />, match: ['/inventory', '/inventory/add', '/inventory/product-master'] },
  { to: '/expenses', label: 'Expenses', icon: <span className="text-sm leading-none">💸</span>, match: ['/expenses'] },
  { to: '/orders', label: 'Queries', icon: <span className="text-sm leading-none">📋</span>, match: ['/orders'] },
  { to: '/ai-chat', label: 'AI', icon: <AIChatBotIcon className="h-4 w-4" />, match: ['/ai-chat'] },
  { to: '/reports', label: 'Reports', icon: <span className="text-sm leading-none">📊</span>, match: ['/reports'] }
]

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const isHome = location.pathname === '/home' || location.pathname === '/'
  const pageTitle = titleMap[location.pathname] || 'Business Overview'

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = search.trim()
    navigate(value ? `/sales?search=${encodeURIComponent(value)}` : '/sales')
  }

  return (
    <header className="border-b border-[#E6D7C3] bg-[#FFFDF9]">
      {/* Clean 1-Row Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          {!isHome ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#E6D7C3] bg-[#FAF5EE] text-[#3B2314] transition active:scale-95 md:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <img src="/brand-mark.png" alt="Sai Gayatri logo" className="h-9 w-9 flex-shrink-0 object-contain md:hidden" />
          )}

          <div className="min-w-0">
            <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#B46528] md:block">
              SAI GAYATRI INDUSTRIES · OPERATIONS
            </div>
            <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#B46528] md:hidden">
              SAI GAYATRI INDUSTRIES
            </div>
            <h1 className="truncate text-lg font-extrabold tracking-tight text-[#2B1810] sm:text-xl">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Mobile Right: Simple Quick New Sale pill (No overlapping search bar!) */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/sales/new"
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#5C3317] to-[#B46528] px-3 py-1.5 text-xs font-bold text-white shadow-xs"
          >
            <span>+</span>
            <span>Sale</span>
          </Link>
        </div>

        {/* Desktop Right: Date + AI Chart + Search */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-lg border border-[#E6D7C3] bg-[#FAF5EE] px-2.5 py-1 text-xs font-semibold text-[#6F452B]">
            {today}
          </div>

          <Link
            to="/ai-chat"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5C3317] to-[#B46528] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-[#4A2811] hover:to-[#9B521D]"
          >
            <span>✨</span>
            <span>AI Chart</span>
          </Link>

          <form onSubmit={submitSearch} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D9C3A8] bg-[#FAF5EE] px-3 py-1.5 focus-within:border-[#B46528] focus-within:bg-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[#7A5C48]"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input
              placeholder="Search customer, invoice..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-40 min-w-0 border-0 bg-transparent text-xs font-medium text-[#2B1810] outline-none placeholder:text-[#A38773] lg:w-48"
            />
          </form>
        </div>
      </div>

      {/* Amazon / Flipkart Style Horizontal Category Icon Strip (Mobile Only) */}
      <div className="flex gap-2 overflow-x-auto border-t border-[#EFE3D2] bg-[#FAF5EE]/75 px-3 py-2.5 md:hidden">
        {mobileQuickIcons.map((item) => {
          const isActive = item.match.includes(location.pathname)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-1.5 transition active:scale-95 ${
                isActive
                  ? 'border-[#5C3317] bg-gradient-to-b from-[#5C3317] to-[#8C4A1F] text-white shadow-xs'
                  : 'border-[#E6D7C3] bg-white text-[#5C3317]'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </header>
  )
}
