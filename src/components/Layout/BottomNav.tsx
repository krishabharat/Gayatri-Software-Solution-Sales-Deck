import { NavLink } from 'react-router-dom'
import { AIChatBotIcon, SalesTagIcon } from '../Icons/AppIcons'

const pillItems = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/categories', label: 'Categories', icon: 'categories' },
  { to: '/ai-chat', label: 'AI', icon: 'ai' },
  { to: '/sales', label: 'Sales', icon: 'sales' }
]

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  ),
  ai: <AIChatBotIcon className="h-5 w-5" />,
  sales: <SalesTagIcon className="h-5 w-5" />
}

export default function BottomNav() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-3 inset-x-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-full border border-[#E6D7C3] bg-[#FFFDF9]/95 px-2 py-2 shadow-[0_12px_32px_rgba(59,35,20,0.18)] backdrop-blur-md md:hidden"
    >
      {pillItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-[#FAF5EE] text-[#B46528] shadow-xs'
                : 'text-[#7A5C48] hover:text-[#3B2314]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? 'text-[#B46528]' : 'text-[#7A5C48]'}>
                {icons[item.icon]}
              </span>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
