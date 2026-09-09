import { useLocation } from 'react-router-dom'

const titleMap: Record<string, string> = {
  '/home': 'Business Overview',
  '/sales': 'Sales',
  '/sales/new': 'New Sale',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Inventory',
  '/inventory/product-master': 'Product Master',
  '/reports': 'Reports'
}

export default function Topbar() {
  const location = useLocation()
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <header className="border-b border-[#eadff2] bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1e7ff] text-lg text-[#412653] shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 13.5 12 5l8 8.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-5.5Z" /></svg>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d5d7f]">Operations</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
              {titleMap[location.pathname] || 'Business Overview'}
            </h1>
            <div className="mt-1 text-sm text-slate-500">{today}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-[#e9dff1] bg-[#faf7ff] px-3 py-2 sm:flex">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-slate-500"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input
              placeholder="Search"
              className="w-40 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dff1] bg-white text-slate-600 transition hover:bg-[#f6f0ff]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
          </button>

          <button aria-label="Profile settings" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dff1] bg-[#412653] text-white shadow-sm transition hover:bg-[#341d42]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 7a7 7 0 0 1 14 0" /></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
