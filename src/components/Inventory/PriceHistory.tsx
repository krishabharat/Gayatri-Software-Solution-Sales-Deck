import { useMemo, useState } from 'react'
import EmptyState from '../EmptyState/EmptyState'
import { formatCurrency, type InventoryItem } from '../../utils/storage'
import { getProductPriceHistory } from '../../utils/inventoryPricing'

type MonthlyPrice = {
  month: string
  label: string
  lowest: number
  highest: number
  entries: number
}

function getProductKey(item: InventoryItem) {
  return item.productId.trim().toLocaleLowerCase() || item.productName.trim().toLocaleLowerCase()
}

function getMonthlyPrices(items: InventoryItem[]): MonthlyPrice[] {
  const months = new Map<string, MonthlyPrice>()

  for (const item of items) {
    const month = item.date.slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(month)) continue

    const price = Number(item.costPerSheet)
    const entry = months.get(month)
    if (entry) {
      entry.lowest = Math.min(entry.lowest, price)
      entry.highest = Math.max(entry.highest, price)
      entry.entries += 1
    } else {
      const [year, monthNumber] = month.split('-').map(Number)
      months.set(month, {
        month,
        label: new Date(year, monthNumber - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        lowest: price,
        highest: price,
        entries: 1
      })
    }
  }

  return Array.from(months.values()).sort((left, right) => left.month.localeCompare(right.month)).slice(-12)
}

export default function PriceHistory({ items }: { items: InventoryItem[] }) {
  const products = useMemo(() => {
    const byKey = new Map<string, InventoryItem>()
    for (const item of items) {
      const key = getProductKey(item)
      if (key && !byKey.has(key)) byKey.set(key, item)
    }
    return Array.from(byKey.entries()).map(([key, item]) => ({
      key,
      label: [item.productId, item.productName].filter(Boolean).join(' · ') || item.productId
    }))
  }, [items])
  const [selectedKey, setSelectedKey] = useState('')
  const activeKey = products.some((product) => product.key === selectedKey) ? selectedKey : products[0]?.key || ''
  const selectedProduct = products.find((product) => product.key === activeKey)
  const history = useMemo(() => {
    if (!selectedProduct) return []
    const firstItem = items.find((item) => getProductKey(item) === selectedProduct.key)
    return getProductPriceHistory(items, firstItem?.productId || '', firstItem?.productName)
  }, [items, selectedProduct])
  const monthlyPrices = useMemo(() => getMonthlyPrices([...history].reverse()), [history])

  const lowestEntry = history.reduce<InventoryItem | undefined>(
    (lowest, item) => !lowest || Number(item.costPerSheet) < Number(lowest.costPerSheet) ? item : lowest,
    undefined
  )
  const latestEntry = history[0]
  const highestEntry = history.reduce<InventoryItem | undefined>(
    (highest, item) => !highest || Number(item.costPerSheet) > Number(highest.costPerSheet) ? item : highest,
    undefined
  )

  return (
    <section className="app-surface p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Purchasing insight</div>
          <h3 className="section-title mt-1">Cost per sheet history</h3>
          <p className="mt-1 text-sm text-slate-500">Compare recorded purchase costs and spot lower-cost months.</p>
        </div>
        {products.length > 0 && (
          <label className="w-full sm:max-w-sm">
            <span className="form-label">Product</span>
            <select
              aria-label="Select product for price history"
              value={activeKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="form-input"
            >
              {products.map((product) => <option key={product.key} value={product.key}>{product.label}</option>)}
            </select>
          </label>
        )}
      </div>

      {!selectedProduct || history.length === 0 ? (
        <EmptyState
          title={selectedProduct ? 'No price history for this product yet' : 'No inventory price history yet'}
          description="Saved inventory records will appear here so you can compare prices by month."
        />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e7f1ef] bg-[#f8fffc] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lowest recorded</div>
              <div className="mt-2 text-xl font-semibold text-emerald-800">{formatCurrency(Number(lowestEntry?.costPerSheet || 0))}</div>
              <div className="mt-1 text-xs text-slate-500">{lowestEntry?.date}</div>
            </div>
            <div className="rounded-2xl border border-[#e7f1ef] bg-[#f8fffc] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest recorded</div>
              <div className="mt-2 text-xl font-semibold text-slate-800">{formatCurrency(Number(latestEntry?.costPerSheet || 0))}</div>
              <div className="mt-1 text-xs text-slate-500">{latestEntry?.date}</div>
            </div>
            <div className="rounded-2xl border border-[#e7f1ef] bg-[#f8fffc] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highest recorded</div>
              <div className="mt-2 text-xl font-semibold text-amber-800">{formatCurrency(Number(highestEntry?.costPerSheet || 0))}</div>
              <div className="mt-1 text-xs text-slate-500">{highestEntry?.date}</div>
            </div>
          </div>

          {monthlyPrices.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-[#e7f1ef] bg-[#fbfefc]">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e6f0ee] text-slate-600">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Lowest cost / sheet</th>
                    <th className="px-4 py-3">Highest cost / sheet</th>
                    <th className="px-4 py-3">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPrices.map((month) => (
                    <tr key={month.month} className="border-b border-[#edf3f2] last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-700">{month.label}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-800">{formatCurrency(month.lowest)}</td>
                      <td className="px-4 py-3 font-semibold text-amber-800">{formatCurrency(month.highest)}</td>
                      <td className="px-4 py-3 text-slate-500">{month.entries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
