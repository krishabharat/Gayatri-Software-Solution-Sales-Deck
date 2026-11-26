import { NavLink } from 'react-router-dom'

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
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4z" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  )
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
