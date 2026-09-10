import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCloudBusinessExpense, getCloudBusinessExpenses, saveCloudBusinessExpense } from '../utils/cloudStorage'
import type { BusinessExpense } from '../utils/storage'

const categories = ['Rent', 'Meshinery expnce', 'Curent bil', 'Termosat', 'Petrol', 'Heating coil', 'rechege', 'Hydrolic oil', 'own expences', 'Die', 'Trasport charges', 'Stock purchase']

export default function BusinessExpenses() {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(categories[0])
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses])

  const load = () => getCloudBusinessExpenses().then(setExpenses).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load expenses.'))
  useEffect(() => { load() }, [])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!date || amount <= 0 || saving) return
    setSaving(true); setError('')
    try { await saveCloudBusinessExpense({ id: `${Date.now()}`, date, category, amount, note, createdAt: new Date().toISOString() }); setAmount(0); setNote(''); await load() }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save expense.') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => { try { await deleteCloudBusinessExpense(id); setExpenses((current) => current.filter((item) => item.id !== id)) } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete expense.') } }

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Daily and monthly operations</div><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Business Expenses</h2></div><Link to="/reports" className="secondary-btn">Back to Reports</Link></header>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={submit} className="app-surface space-y-4 p-5 sm:p-6"><h3 className="section-title">Add expense</h3><div><label className="form-label">Date</label><input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><label className="form-label">Expense Type</label><select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="form-label">Amount</label><input type="number" min="0" step="0.01" className="form-input" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value || 0))} placeholder="₹0" /></div><div><label className="form-label">Note (optional)</label><textarea className="form-input min-h-[90px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Details about this expense" /></div><button className="primary-btn w-full" disabled={saving || amount <= 0}>{saving ? 'SAVING...' : 'SAVE EXPENSE'}</button></form>
      <section className="app-surface overflow-hidden p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="section-title">Expense history</h3><div className="mt-1 text-sm">Total recorded: ₹{total.toLocaleString('en-IN')}</div></div></div>{expenses.length === 0 ? <div className="empty-panel">No business expenses recorded yet</div> : <div className="space-y-3">{expenses.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-[#e7f1ef] bg-[#f9fffd] p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>{item.category}</strong><div className="text-sm">{item.date}{item.note ? ` · ${item.note}` : ''}</div></div><div className="flex items-center gap-3"><strong>₹{item.amount.toLocaleString('en-IN')}</strong><button className="muted-btn text-red-600" onClick={() => remove(item.id)}>Delete</button></div></div>)}</div>}</section></div>
  </div>
}
