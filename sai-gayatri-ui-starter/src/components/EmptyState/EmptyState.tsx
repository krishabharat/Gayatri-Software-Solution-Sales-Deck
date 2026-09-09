import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  cta?: ReactNode
}

export default function EmptyState({ title, description, cta }: EmptyStateProps) {
  return (
    <div className="empty-panel">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebfff8] text-2xl text-[#0f6b63] shadow-sm">
        •
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  )
}
