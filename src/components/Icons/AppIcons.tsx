export function SalesTagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v6.5L11 21l-7.5-7.5 9-10Z" />
      <circle cx="16" cy="8" r="1.25" fill="currentColor" stroke="none" />
      <path d="M17.2 6.8a3.2 3.2 0 1 1 2.2 2.2" />
      <path d="M7.5 13.5l3-3M9.5 15.5l2-2" />
    </svg>
  )
}

export function InventoryCycleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Circular arrows */}
      <path d="M4.5 16.5A8.5 8.5 0 0 1 12 3.5h1" />
      <path d="M11 2l2.2 1.5L11 5" />
      <path d="M19.5 7.5A8.5 8.5 0 0 1 12 20.5h-1" />
      <path d="M13 22l-2.2-1.5L13 19" />
      {/* 3D Box */}
      <path d="M8.5 9.8 12 7.8l3.5 2v4l-3.5 2-3.5-2v-4Z" />
      <path d="M8.5 9.8 12 11.8l3.5-2M12 11.8v4" />
      {/* Checkmark badge */}
      <circle cx="15.8" cy="14.8" r="2.6" fill="currentColor" stroke="none" />
      <path d="M14.7 14.8l.7.7 1.5-1.5" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

export function AIChatBotIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Antenna */}
      <path d="M12 5V3" />
      <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
      {/* Headset band */}
      <path d="M5 12a7 7 0 0 1 14 0" />
      {/* Ear cups */}
      <rect x="3.2" y="10.2" width="2.2" height="4.6" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="18.6" y="10.2" width="2.2" height="4.6" rx="1.1" fill="currentColor" stroke="none" />
      {/* Mic boom */}
      <path d="M5.5 14.8c0 3.2 2.4 4.8 6 4.8" />
      <circle cx="12.5" cy="19.6" r="1.2" fill="currentColor" stroke="none" />
      {/* Bot Face */}
      <rect x="6.5" y="7.2" width="11" height="8.5" rx="4.2" fill="currentColor" stroke="none" />
      {/* Eyes & Smile */}
      <circle cx="9.8" cy="11" r="1" fill="#ffffff" stroke="none" />
      <circle cx="14.2" cy="11" r="1" fill="#ffffff" stroke="none" />
      <path d="M10.2 13.3a2 2 0 0 0 3.6 0" stroke="#ffffff" strokeWidth="1.4" />
    </svg>
  )
}

export function UserOutlineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.2 19.5a7.2 7.2 0 0 1 13.6 0" />
    </svg>
  )
}

export function FinanceCycleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Circular arrows */}
      <path d="M5 10.5A7.5 7.5 0 0 1 18.2 7.2" />
      <path d="M18.8 4.2v3.3h-3.3" />
      <path d="M19 13.5A7.5 7.5 0 0 1 5.8 16.8" />
      <path d="M5.2 19.8v-3.3h3.3" />
      {/* Dollar / Currency sign */}
      <path d="M12 7.5v9" />
      <path d="M14.2 9.5a2.1 2.1 0 0 0-2.2-1.3c-1.3 0-2.2.7-2.2 1.7 0 1 .9 1.5 2.2 1.8 1.3.3 2.3.8 2.3 1.9s-1 1.9-2.3 1.9a2.2 2.2 0 0 1-2.3-1.4" />
    </svg>
  )
}

export function QuickAccessIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12L13 2Z" />
    </svg>
  )
}
