import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState } from 'react'

const titleMap: Record<string, string> = {
  '/home': 'Business Overview',
  '/ai-chat': 'AI Chart & Gemini Intelligence',
  '/sales': 'Sales Management',
  '/sales/new': 'New Sale Invoice',
  '/inventory': 'Inventory Control',
  '/inventory/add': 'Add Stock Intake',
  '/inventory/product-master': 'Product Master Catalog',
  '/reports': 'Performance Reports',
  '/orders': 'Customer Queries & Orders',
  '/expenses': 'Business Expenses',
  '/customers': 'Customer Directory',
  '/suppliers': 'Supplier Directory'
}

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

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = search.trim()
    navigate(value ? `/sales?search=${encodeURIComponent(value)}` : '/sales')
  }

  return (
    <header className="border-b border-[#E6D7C3] bg-[#FFFDF9] px-4 py-3.5 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/brand-mark.png" alt="Sai Gayatri logo" className="h-10 w-10 object-contain md:hidden" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B46528]">
              SAI GAYATRI INDUSTRIES · OPERATIONS
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#2B1810]">
              {titleMap[location.pathname] || 'Business Overview'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg border border-[#E6D7C3] bg-[#FAF5EE] px-2.5 py-1 text-xs font-semibold text-[#6F452B] md:block">
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
              className="w-28 min-w-0 border-0 bg-transparent text-xs font-medium text-[#2B1810] outline-none placeholder:text-[#A38773] sm:w-44"
            />
          </form>
        </div>
      </div>
    </header>
  )
}
