import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState/EmptyState'
import { formatCurrency, type InventoryItem, type SaleRecord } from '../utils/storage'
import { describeCloudError, getCloudBusinessExpenses, getCloudInventoryItems, getCloudSalesRecords } from '../utils/cloudStorage'
import { getAIBaseUrl } from '../utils/aiSync'
import GraphicalChart, { type ChartData } from '../components/Charts/GraphicalChart'

export default function Home() {
  const today = new Date().toISOString().slice(0, 10)
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [monthlyChart, setMonthlyChart] = useState<ChartData>({
    type: 'bar',
    title: 'Monthly Revenue (₹)',
    labels: ['2026-09', '2026-10', '2026-11'],
    values: [10980, 13747, 1900],
    valuePrefix: '₹'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const base = getAIBaseUrl()
    if (base) {
      fetch(`${base}/api/summary`)
        .then((res) => (res.ok ? res.json() : null))
        .then((summary) => {
          if (summary?.charts?.monthly_sales?.length) {
            setMonthlyChart({
              type: 'bar',
              title: 'Monthly Sales Revenue (₹)',
              labels: summary.charts.monthly_sales.map((m: { month: string }) => m.month),
              values: summary.charts.monthly_sales.map((m: { revenue: number }) => Math.round(m.revenue)),
              valuePrefix: '₹'
            })
          }
        })
        .catch(() => {})
    }

    Promise.all([getCloudSalesRecords(), getCloudInventoryItems(), getCloudBusinessExpenses()])
      .then(([loadedSales, loadedInventory, expenses]) => {
        if (loadedSales && loadedSales.length > 0) {
          setSales(loadedSales)
        }
        if (loadedInventory && loadedInventory.length > 0) {
          setInventoryItems(loadedInventory)
        }
        if (expenses && expenses.length > 0) {
          setExpenseTotal(expenses.reduce((sum, expense) => sum + expense.amount, 0))
        }
      })
      .catch((loadError) => setError(describeCloudError(loadError, 'Unable to load cloud dashboard data.')))
  }, [])

  const kpis = useMemo(() => {
    const todaysSales = sales.filter((sale) => sale.saleDate === today)
    const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const totalPlates = sales.reduce((sum, sale) => sum + sale.totalPlates, 0)
    const pendingPayments = sales.filter((sale) => sale.paymentStatus !== 'Paid').reduce((sum, sale) => sum + sale.remaining, 0)
    const inventoryValue = inventoryItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
    const totalCustomers = new Set(sales.map((sale) => sale.customerName)).size
    const netProfit = totalRevenue - expenseTotal

    return [
      { label: "Today's Sales", value: formatCurrency(todaysRevenue), note: todaysRevenue > 0 ? 'Recorded today' : 'No sales today', tone: 'text-[#8C4A1F]' },
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), note: `${sales.length} invoices`, tone: 'text-[#2B1810]' },
      { label: 'Plates Sold', value: totalPlates.toLocaleString(), note: 'Total manufactured', tone: 'text-[#5C3317]' },
      { label: 'Pending Dues', value: formatCurrency(pendingPayments), note: 'Awaiting collection', tone: 'text-[#B45309]' },
      { label: 'Inventory Value', value: formatCurrency(inventoryValue), note: 'Current stock value', tone: 'text-emerald-700' },
      { label: 'Estimated Profit', value: formatCurrency(netProfit), note: `${totalCustomers} active clients`, tone: 'text-[#2B1810]' }
    ]
  }, [expenseTotal, inventoryItems, sales, today])

  const hasSales = sales.length > 0
  const hasInventory = inventoryItems.length > 0

  return (
    <div className="space-y-7 text-[#2B1810]">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

      {/* Warm Chocolate Truffle Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3B2314] via-[#5C3317] to-[#8C4A1F] p-6 text-[#FFFDF9] shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F6D5B0] border border-white/15 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Cloud Operations · Sai Gayatri Industries
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back to your Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-[#F3E6D5]/90 max-w-xl">
              Monitor daily sales, stock levels, pending dues, and business expenses at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/sales/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F3D5B5] to-[#E6B88A] px-5 py-2.5 text-xs font-extrabold text-[#2B1810] shadow-md transition hover:brightness-105 active:scale-95"
            >
              <span>+</span>
              <span>New Sale</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white border border-white/25 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>📊</span>
              <span>Reports</span>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#C67D3B]/25 blur-3xl" />
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A5C48]">{kpi.label}</div>
            <div className={`mt-2.5 text-xl font-extrabold tracking-tight sm:text-2xl ${kpi.tone}`}>{kpi.value}</div>
            <div className="mt-1 text-xs font-medium text-[#7A5C48]">{kpi.note}</div>
          </div>
        ))}
      </section>

      {/* Graphical Sales Overview & Recent Invoices */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="app-surface p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Sales Overview</h2>
            <Link to="/reports" className="muted-btn">Full Reports &rarr;</Link>
          </div>
          <GraphicalChart chart={monthlyChart} />
        </div>

        <div className="app-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Recent Invoices</h2>
            <Link to="/sales/new" className="primary-btn text-xs">+ New Sale</Link>
          </div>
          {hasSales ? (
            <div className="space-y-3">
              {sales.slice(0, 4).map((sale) => (
                <div key={sale.id} className="rounded-xl border border-[#EFE3D2] bg-[#FAF5EE]/60 p-3.5 transition hover:border-[#C67D3B] hover:bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#2B1810]">{sale.customerName}</div>
                      <div className="text-xs text-[#7A5C48]">{sale.saleDate} · {sale.paymentStatus}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#2B1810]">{formatCurrency(sale.grandTotal)}</div>
                      {sale.remaining > 0 && (
                        <div className="text-xs font-semibold text-[#B45309]">Due: {formatCurrency(sale.remaining)}</div>
                      )}
                    </div>
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

      {/* Stock Inventory & Quick Tools */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="app-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Stock Inventory</h2>
              <p className="text-xs text-[#7A5C48]">Latest raw materials and finished plate batches</p>
            </div>
            <div className="flex gap-2">
              <Link to="/inventory/add" className="secondary-btn text-xs">+ Add Stock</Link>
              <Link to="/inventory" className="primary-btn text-xs">View All</Link>
            </div>
          </div>
          {hasInventory ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {inventoryItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#EFE3D2] bg-[#FAF5EE]/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5C48]">{item.productId || 'Item'}</span>
                    <span className="rounded-full bg-[#F3E6D5] px-2 py-0.5 text-[10px] font-bold text-[#8C4A1F] border border-[#D9C3A8]">{item.type || 'Stock'}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-[#2B1810]">{item.productName || 'Product'}</div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[#6F452B]">
                    <span>Qty: <strong className="text-[#2B1810]">{item.quantity}</strong></span>
                    <span>Cost: <strong className="text-[#2B1810]">{formatCurrency(item.totalCost)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No inventory data available yet"
              description="Track stock movements and inventory value as records are added."
              cta={<Link to="/inventory" className="secondary-btn">+ Add Stock</Link>}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link to="/orders" className="app-surface block p-5 transition hover:-translate-y-0.5 hover:border-[#C67D3B] hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#B46528]">Operations</div>
            <h3 className="mt-1 text-base font-bold text-[#2B1810]">Customer Queries & Orders</h3>
            <p className="mt-1 text-xs text-[#7A5C48]">Manage advance orders, covers, delivery dates & stages.</p>
          </Link>
          <Link to="/expenses" className="app-surface block p-5 transition hover:-translate-y-0.5 hover:border-[#C67D3B] hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C4A1F]">Finance</div>
            <h3 className="mt-1 text-base font-bold text-[#2B1810]">Business Expenses</h3>
            <p className="mt-1 text-xs text-[#7A5C48]">Track rent, electricity bills, machinery, transport & daily costs.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
