import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CategoryGroup {
  id: string
  label: string
  icon: string
  items: Array<{
    to: string
    title: string
    subtitle: string
    icon: string
    badge?: string
  }>
}

const GROUPS: CategoryGroup[] = [
  {
    id: 'all',
    label: 'For You',
    icon: '⭐',
    items: [
      { to: '/sales/new', title: 'New Sale', subtitle: 'Create invoice fast', icon: '⚡', badge: 'FAST' },
      { to: '/ai-chat', title: 'AI Chart', subtitle: 'Gemini + Quick Sale', icon: '✨', badge: 'AI' },
      { to: '/sales', title: 'All Sales', subtitle: 'Invoices & dues', icon: '🧾' },
      { to: '/orders', title: 'Queries', subtitle: 'Orders & delivery', icon: '📋' },
      { to: '/inventory', title: 'Inventory', subtitle: 'Products & stock', icon: '📦' },
      { to: '/customers', title: 'Customers', subtitle: 'Saved buyers', icon: '👤' },
      { to: '/expenses', title: 'Expenses', subtitle: 'Rent, bills & fuel', icon: '💸' },
      { to: '/reports', title: 'Reports', subtitle: 'Monthly profits', icon: '📊' }
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: '🧾',
    items: [
      { to: '/sales/new', title: 'New Sale Invoice', subtitle: 'Add customer & items', icon: '➕' },
      { to: '/sales', title: 'Sales History', subtitle: 'View & edit bills', icon: '🧾' },
      { to: '/orders', title: 'Customer Queries', subtitle: 'Advance bookings', icon: '📋' },
      { to: '/ai-chat?q=Show%20unpaid%20dues', title: 'Pending Dues', subtitle: 'Unpaid balances', icon: '⚠️' }
    ]
  },
  {
    id: 'stock',
    label: 'Inventory',
    icon: '📦',
    items: [
      { to: '/inventory', title: 'Product Master', subtitle: 'Prices & min stock', icon: '🏷️' },
      { to: '/inventory/add', title: 'Add Stock Intake', subtitle: 'Log new purchase', icon: '📥' },
      { to: '/suppliers', title: 'Suppliers', subtitle: 'Vendor contacts', icon: '🚚' }
    ]
  },
  {
    id: 'people',
    label: 'Users',
    icon: '👤',
    items: [
      { to: '/customers', title: 'Customers', subtitle: 'Add & view clients', icon: '👤' },
      { to: '/suppliers', title: 'Suppliers', subtitle: 'Raw sheet vendors', icon: '🏭' },
      { to: '/ai-chat?q=All%20customers%20sales%20history', title: 'Client History', subtitle: 'AI spend breakdown', icon: '💬' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💸',
    items: [
      { to: '/expenses', title: 'Business Expenses', subtitle: 'Rent, coils, bills', icon: '💸' },
      { to: '/reports', title: 'Monthly Reports', subtitle: 'Revenue vs cost', icon: '📊' },
      { to: '/ai-chat?q=Compare%20monthly%20sales', title: 'AI Profit Chart', subtitle: 'Visual trends', icon: '📈' }
    ]
  }
]

export default function Categories() {
  const [activeGroup, setActiveGroup] = useState<string>('all')
  const current = GROUPS.find((g) => g.id === activeGroup) || GROUPS[0]

  return (
    <div className="space-y-4">
      {/* Flipkart-inspired Split Rail (Left Category Rail + Right Touch Grid) */}
      <div className="flex min-h-[70vh] overflow-hidden rounded-2xl border border-[#E6D7C3] bg-white shadow-xs">
        {/* Left Rail */}
        <div className="w-24 flex-shrink-0 border-r border-[#EFE3D2] bg-[#FAF5EE] py-2 sm:w-32">
          {GROUPS.map((grp) => {
            const active = grp.id === activeGroup
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setActiveGroup(grp.id)}
                className={`relative flex w-full flex-col items-center gap-1 px-2 py-3.5 text-center transition ${
                  active ? 'bg-white text-[#8C4A1F] font-extrabold' : 'text-[#7A5C48] hover:bg-white/60'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#B46528]" />
                )}
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3E6D5]/70 text-xl">
                  {grp.icon}
                </span>
                <span className="text-[11px] font-bold leading-tight">{grp.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Grid */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#2B1810]">{current.label}</h2>
            <span className="text-xs font-semibold text-[#8C4A1F]">{current.items.length} tools</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {current.items.map((item) => (
              <Link
                key={item.to + item.title}
                to={item.to}
                className="relative flex flex-col items-center justify-center rounded-2xl border border-[#EFE3D2] bg-[#FAF5EE]/50 p-4 text-center transition hover:border-[#C67D3B] hover:bg-white active:scale-95"
              >
                {item.badge && (
                  <span className="absolute right-2 top-2 rounded-full bg-[#5C3317] px-2 py-0.5 text-[9px] font-extrabold text-white">
                    {item.badge}
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E6D5] text-2xl shadow-xs">
                  {item.icon}
                </span>
                <div className="mt-2.5 text-xs font-extrabold text-[#2B1810]">{item.title}</div>
                <div className="mt-0.5 text-[10px] font-medium text-[#7A5C48]">{item.subtitle}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
