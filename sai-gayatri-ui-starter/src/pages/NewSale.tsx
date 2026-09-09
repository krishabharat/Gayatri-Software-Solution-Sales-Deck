import { useSearchParams } from 'react-router-dom'
import SaleForm from '../components/SaleForm/SaleForm'

export default function NewSale() {
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(searchParams.get('id'))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Sales entry</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">{isEditing ? 'Edit Sale' : 'New Sale'}</h2>
        </div>
      </header>

      <div className="app-surface p-4 sm:p-6">
        <SaleForm />
      </div>
    </div>
  )
}
