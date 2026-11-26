import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AIChatBotIcon,
  FinanceCycleIcon,
  InventoryCycleIcon,
  QuickAccessIcon,
  SalesTagIcon,
  UserOutlineIcon
} from '../components/Icons/AppIcons'

interface CategoryGroup {
  id: string
  label: string
  icon: React.ReactNode
  items: Array<{
    to: string
    title: string
    subtitle: string
    icon: React.ReactNode
    badge?: string
  }>
}

const GROUPS: CategoryGroup[] = [
  {
    id: 'quick',
    label: 'Quick Access',
    icon: <QuickAccessIcon className="h-5 w-5" />,
    items: [
      { to: '/sales/new', title: 'New Sale', subtitle: 'Create invoice fast', icon: <SalesTagIcon className="h-6 w-6" />, badge: 'FAST' },
      { to: '/ai-chat', title: 'AI Chart', subtitle: 'Gemini + Quick Sale', icon: <AIChatBotIcon className="h-6 w-6" />, badge: 'AI' },
      { to: '/sales', title: 'All Sales', subtitle: 'Invoices & dues', icon: <SalesTagIcon className="h-6 w-6" /> },
      { to: '/orders', title: 'Queries', subtitle: 'Orders & delivery', icon: <span className="text-xl">📋</span> },
      { to: '/inventory', title: 'Inventory', subtitle: 'Products & stock', icon: <InventoryCycleIcon className="h-6 w-6" /> },
      { to: '/customers', title: 'Users', subtitle: 'Saved buyers', icon: <UserOutlineIcon className="h-6 w-6" /> },
      { to: '/expenses', title: 'Finance', subtitle: 'Rent, bills & fuel', icon: <FinanceCycleIcon className="h-6 w-6" /> },
      { to: '/reports', title: 'Reports', subtitle: 'Monthly profits', icon: <span className="text-xl">📊</span> }
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <SalesTagIcon className="h-5 w-5" />,
    items: [
      { to: '/sales/new', title: 'New Sale Invoice', subtitle: 'Add customer & items', icon: <SalesTagIcon className="h-6 w-6" /> },
      { to: '/sales', title: 'Sales History', subtitle: 'View & edit bills', icon: <SalesTagIcon className="h-6 w-6" /> },
      { to: '/orders', title: 'Customer Queries', subtitle: 'Advance bookings', icon: <span className="text-xl">📋</span> },
      { to: '/ai-chat?q=Show%20unpaid%20dues', title: 'Pending Dues', subtitle: 'Unpaid balances', icon: <FinanceCycleIcon className="h-6 w-6" /> }
    ]
  },
  {
    id: 'stock',
    label: 'Inventory',
    icon: <InventoryCycleIcon className="h-5 w-5" />,
    items: [
      { to: '/inventory', title: 'Product Master', subtitle: 'Prices & min stock', icon: <InventoryCycleIcon className="h-6 w-6" /> },
      { to: '/inventory/add', title: 'Add Stock Intake', subtitle: 'Log new purchase', icon: <InventoryCycleIcon className="h-6 w-6" /> },
      { to: '/suppliers', title: 'Suppliers', subtitle: 'Vendor contacts', icon: <UserOutlineIcon className="h-6 w-6" /> }
    ]
  },
  {
    id: 'people',
    label: 'Users',
    icon: <UserOutlineIcon className="h-5 w-5" />,
    items: [
      { to: '/customers', title: 'Customers', subtitle: 'Add & view clients', icon: <UserOutlineIcon className="h-6 w-6" /> },
      { to: '/suppliers', title: 'Suppliers', subtitle: 'Raw sheet vendors', icon: <UserOutlineIcon className="h-6 w-6" /> },
      { to: '/ai-chat?q=All%20customers%20sales%20history', title: 'Client History', subtitle: 'AI spend breakdown', icon: <AIChatBotIcon className="h-6 w-6" /> }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <FinanceCycleIcon className="h-5 w-5" />,
    items: [
      { to: '/expenses', title: 'Business Expenses', subtitle: 'Rent, coils, bills', icon: <FinanceCycleIcon className="h-6 w-6" /> },
      { to: '/reports', title: 'Monthly Reports', subtitle: 'Revenue vs cost', icon: <span className="text-xl">📊</span> },
      { to: '/ai-chat?q=Compare%20monthly%20sales', title: 'AI Profit Chart', subtitle: 'Visual trends', icon: <AIChatBotIcon className="h-6 w-6" /> }
    ]
  }
]

export default function Categories() {
  const [activeGroup, setActiveGroup] = useState<string>('quick')
  const current = GROUPS.find((g) => g.id === activeGroup) || GROUPS[0]

  return (
    <div className="space-y-4">
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
                className={`relative flex w-full flex-col items-center gap-1.5 px-2 py-3.5 text-center transition ${
                  active ? 'bg-white text-[#8C4A1F] font-extrabold' : 'text-[#5C3317] hover:bg-white/60'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#B46528]" />
                )}
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    active ? 'bg-[#5C3317] text-white' : 'bg-[#F3E6D5]/80 text-[#5C3317]'
                  }`}
                >
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E6D5] text-[#5C3317] shadow-xs">
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
