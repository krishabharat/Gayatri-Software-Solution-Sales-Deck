import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import EmptyState from '../components/EmptyState/EmptyState'
import { formatCurrency, getInventoryItems, getSalesRecords } from '../utils/storage'

const today = new Date().toISOString().slice(0, 10)

export default function Home() {
  const sales = getSalesRecords()
  const inventoryItems = getInventoryItems()

  const kpis = useMemo(() => {
    const todaysSales = sales.filter((sale) => sale.saleDate === today)
    const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const todaysPlates = todaysSales.reduce((sum, sale) => sum + sale.totalPlates, 0)
    const pendingPayments = sales.filter((sale) => sale.paymentStatus !== 'Paid').reduce((sum, sale) => sum + sale.remaining, 0)
    const inventoryValue = inventoryItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
    const totalCustomers = new Set(sales.map((sale) => sale.customerName)).size
    const monthlyProfit = sales.reduce((sum, sale) => sum + Math.max(0, sale.grandTotal - sale.discount - sale.products.reduce((productCost, product) => productCost + product.quantity * product.selling, 0)), 0)

    return [
      { label: "Today's Sales", value: formatCurrency(todaysRevenue), note: todaysRevenue > 0 ? 'Sales recorded today' : 'No sales yet' },
      { label: "Today's Plates Sold", value: String(todaysPlates), note: todaysPlates > 0 ? 'Plates sold today' : 'No plates sold yet' },
      { label: 'Pending Payments', value: formatCurrency(pendingPayments), note: pendingPayments > 0 ? 'Amount awaiting collection' : 'No pending payments yet' },
      { label: 'Inventory Value', value: formatCurrency(inventoryValue), note: inventoryValue > 0 ? 'Current inventory value' : 'No inventory data yet' },
      { label: 'Total Customers', value: String(totalCustomers), note: totalCustomers > 0 ? 'Active customers' : 'No customers yet' },
      { label: 'Monthly Profit', value: formatCurrency(monthlyProfit), note: monthlyProfit > 0 ? 'Estimated profit' : 'No profit data yet' }
    ]
  }, [inventoryItems, sales])

  const hasSales = sales.length > 0
  const hasInventory = inventoryItems.length > 0

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{kpi.label}</div>
            <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-800">{kpi.value}</div>
            <div className="mt-2 text-sm text-slate-500">{kpi.note}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Sales Overview</h2>
            <button className="muted-btn">This Month</button>
          </div>
          {hasSales ? (
            <div className="flex min-h-[240px] items-end gap-3 rounded-[20px] border border-[#e7f1ef] bg-[#f8fffc] p-4">
              {Array.from({ length: 6 }).map((_, index) => {
                const height = 18 + ((index + 1) * 14) % 65
                return <div key={index} className="flex-1 rounded-t-[16px] bg-gradient-to-t from-[#0f6b63] to-[#8ddfc2]" style={{ height: `${height}%` }} />
              })}
            </div>
          ) : (
            <div className="empty-panel min-h-[240px]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ebfff8] text-xl text-[#0f6b63]">▣</div>
              <div className="text-base font-medium text-slate-700">No sales data available yet</div>
            </div>
          )}
        </div>

        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Recent Sales</h2>
            <Link to="/sales/new" className="primary-btn">+ New Sale</Link>
          </div>
          {hasSales ? (
            <div className="space-y-3">
              {sales.slice(0, 3).map((sale) => (
                <div key={sale.id} className="rounded-2xl border border-[#e7f1ef] bg-[#f9fffd] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{sale.customerName}</div>
                      <div className="text-xs text-slate-500">{sale.saleDate}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{formatCurrency(sale.grandTotal)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sales recorded yet"
              description="Create your first sale to start tracking your business performance."
              cta={<Link to="/sales/new" className="primary-btn">+ New Sale</Link>}
            />
          )}
        </div>
      </section>

      <section className="app-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Inventory Status</h2>
          <div className="flex gap-2">
            <Link to="/sales/new" className="primary-btn">+ New Sale</Link>
            <Link to="/inventory/add" className="secondary-btn">+ Add Inventory</Link>
          </div>
        </div>
        {hasInventory ? (
          <div className="grid gap-3 md:grid-cols-3">
            {inventoryItems.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#e7f1ef] bg-[#f8fffc] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{item.productId || item.productName || 'Product'}</div>
                <div className="mt-2 text-lg font-semibold text-slate-800">{item.productName || 'Unnamed product'}</div>
                <div className="mt-2 text-sm text-slate-600">Qty: {item.quantity}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No inventory data available yet"
            description="Track stock movements and inventory value as records are added."
            cta={<Link to="/inventory/add" className="secondary-btn">+ Add Inventory</Link>}
          />
        )}
      </section>
    </div>
  )
}
