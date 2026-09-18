import { useEffect, useState } from 'react'
import { deleteCloudCustomer, deleteCloudSupplier, describeCloudError, getCloudCustomers, getCloudSuppliers, saveCloudCustomer, saveCloudSupplier } from '../utils/cloudStorage'
import type { Customer, Supplier } from '../utils/storage'

type Mode = 'customers' | 'suppliers'

export default function MasterData({ mode }: { mode: Mode }) {
  const isCustomer = mode === 'customers'
  const [records, setRecords] = useState<(Customer | Supplier)[]>([])
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try { setRecords(isCustomer ? await getCloudCustomers() : await getCloudSuppliers()) }
    catch (loadError) { setError(describeCloudError(loadError, `Unable to load ${isCustomer ? 'customers' : 'suppliers'}.`)) }
  }
  useEffect(() => { void load() }, [isCustomer])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || (isCustomer && !mobile.trim()) || saving) return
    setSaving(true); setError('')
    try {
      if (isCustomer) await saveCloudCustomer({ id: `${Date.now()}`, name: name.trim(), mobile: mobile.trim(), createdAt: new Date().toISOString() })
      else await saveCloudSupplier({ id: `${Date.now()}`, name: name.trim(), mobile: mobile.trim(), createdAt: new Date().toISOString() })
      setName(''); setMobile(''); await load()
    } catch (saveError) { setError(describeCloudError(saveError, `Unable to save ${isCustomer ? 'customer' : 'supplier'}.`)) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try {
      if (isCustomer) await deleteCloudCustomer(id)
      else await deleteCloudSupplier(id)
      setRecords((current) => current.filter((record) => record.id !== id))
    } catch (deleteError) { setError(describeCloudError(deleteError, 'Unable to delete record.')) }
  }

  return <div className="space-y-6 pb-8">
    <header><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Master data</div><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{isCustomer ? 'Customers' : 'Suppliers'}</h2></header>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <form onSubmit={submit} className="app-surface grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:p-6">
      <div><label className="form-label">{isCustomer ? 'Customer Name' : 'Supplier Name'} *</label><input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder={isCustomer ? 'Customer name' : 'Supplier name'} /></div>
      <div><label className="form-label">Mobile Number {isCustomer ? '*' : '(optional)'}</label><input className="form-input" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="Mobile number" inputMode="tel" /></div>
      <button className="primary-btn self-end" disabled={saving || !name.trim() || (isCustomer && !mobile.trim())}>{saving ? 'SAVING...' : `ADD ${isCustomer ? 'CUSTOMER' : 'SUPPLIER'}`}</button>
    </form>
    <section className="app-surface p-5 sm:p-6"><h3 className="section-title mb-4">Saved {isCustomer ? 'customers' : 'suppliers'}</h3>{records.length === 0 ? <div className="empty-panel">No {isCustomer ? 'customers' : 'suppliers'} added yet</div> : <div className="space-y-3">{records.map((record) => <div key={record.id} className="flex items-center justify-between rounded-2xl border border-[#e7f1ef] bg-[#f9fffd] p-4"><div><strong>{record.name}</strong><div className="text-sm">{record.mobile || 'No mobile number'}</div></div><button className="muted-btn text-red-600" onClick={() => remove(record.id)}>Delete</button></div>)}</div>}</section>
  </div>
}
