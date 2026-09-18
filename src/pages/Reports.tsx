import { formatCurrency, type InventoryItem, type SaleRecord } from '../utils/storage'
import { useEffect, useMemo, useState } from 'react'
import { describeCloudError, getCloudBusinessExpenses, getCloudInventoryItems, getCloudOrderQueries, getCloudSalesRecords } from '../utils/cloudStorage'

const filters = ['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range']

export default function Reports() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    Promise.all([getCloudSalesRecords(), getCloudInventoryItems(), getCloudBusinessExpenses(), getCloudOrderQueries()])
      .then(([loadedSales, loadedInventory, expenses]) => {
        setSales(loadedSales)
        setInventory(loadedInventory)
        setExpenseTotal(expenses.reduce((sum, item) => sum + item.amount, 0))
      })
      .catch((error) => setLoadError(describeCloudError(error, 'Unable to load cloud report data.')))
  }, [])
  const hasData = sales.length > 0 || inventory.length > 0
  const [selectedFilter, setSelectedFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const filteredData = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const weekStart = startOfWeek.toISOString().slice(0, 10)
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
    const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth(), 0).getDate()).padStart(2, '0')}`

    let start = ''
    let end = today
    if (selectedFilter === 'Today') start = today
    if (selectedFilter === 'This Week') start = weekStart
    if (selectedFilter === 'This Month') start = monthStart
    if (selectedFilter === 'Last Month') { start = lastMonthStart; end = lastMonthEnd }
    if (selectedFilter === 'Custom Range') { start = customStart; end = customEnd || today }

    const inRange = (date: string) => (!start || date >= start) && (!end || date <= end)
    return {
      sales: sales.filter((sale) => inRange(sale.saleDate)),
      inventory: inventory.filter((item) => inRange(item.date))
    }
  }, [customEnd, customStart, inventory, sales, selectedFilter])

  const filteredSales = filteredData.sales
  const filteredInventory = filteredData.inventory
  const filteredHasData = filteredSales.length > 0 || filteredInventory.length > 0

  const salesMetrics = {
    totalSales: filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0),
    totalPlates: filteredSales.reduce((sum, sale) => sum + sale.totalPlates, 0),
    paid: filteredSales.filter((sale) => sale.paymentStatus === 'Paid').reduce((sum, sale) => sum + sale.grandTotal, 0),
    unpaid: filteredSales.filter((sale) => sale.paymentStatus !== 'Paid').reduce((sum, sale) => sum + sale.remaining, 0),
    customers: new Set(filteredSales.map((sale) => sale.customerName)).size
  }

  const inventoryMetrics = {
    totalStock: filteredInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    inventoryValue: filteredInventory.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    purchases: filteredInventory.filter((item) => item.type === 'Purchased').reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    transportCost: filteredInventory.reduce((sum, item) => sum + Number(item.transportCost || 0), 0),
    lowStock: filteredInventory.filter((item) => Number(item.quantity || 0) <= 0).length
  }

  const profitMetrics = {
    revenue: salesMetrics.totalSales,
    productCost: filteredSales.reduce((sum, sale) => sum + sale.products.reduce((itemSum, product) => itemSum + product.quantity * product.purchaseCost, 0), 0),
    transportCost: inventoryMetrics.transportCost,
    estimatedProfit: salesMetrics.totalSales - filteredSales.reduce((sum, sale) => sum + sale.products.reduce((itemSum, product) => itemSum + product.quantity * product.purchaseCost, 0), 0) - inventoryMetrics.transportCost - expenseTotal
  }

  const renderMetric = (label: string, value: string) => (
    <div key={label} className="rounded-2xl border border-[#ebf3f1] bg-[#fafefc] p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-800">{value}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Business intelligence</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">Reports</h2>
        </div>
      </header>
      {loadError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loadError}</div>}

      <div className="app-surface p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button key={filter} className={`filter-chip ${selectedFilter === filter ? 'border-[#0f6b63] bg-[#eafaf5] text-[#0f6b63]' : ''}`} type="button" onClick={() => setSelectedFilter(filter)}>{filter}</button>
          ))}
        </div>
        {selectedFilter === 'Custom Range' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label className="form-label">From</label><input type="date" className="form-input" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div>
            <div><label className="form-label">To</label><input type="date" className="form-input" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>
          </div>
        )}
        <div className="mt-3 text-xs font-semibold text-slate-500">Showing: {selectedFilter}{selectedFilter === 'Custom Range' && customStart ? ` (${customStart} to ${customEnd || 'today'})` : ''}</div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sales Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Sales', filteredHasData ? formatCurrency(salesMetrics.totalSales) : '₹0'],
              ['Total Plates', filteredHasData ? String(salesMetrics.totalPlates) : '0'],
              ['Paid', filteredHasData ? formatCurrency(salesMetrics.paid) : '₹0'],
              ['Unpaid', filteredHasData ? formatCurrency(salesMetrics.unpaid) : '₹0'],
              ['Customers', filteredHasData ? String(salesMetrics.customers) : '0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!filteredHasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">{hasData ? 'No data in this date range' : 'No report data available yet'}</div></div>}
        </div>

        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Inventory Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Stock', filteredHasData ? String(inventoryMetrics.totalStock) : '0'],
              ['Inventory Value', filteredHasData ? formatCurrency(inventoryMetrics.inventoryValue) : '₹0'],
              ['Purchases', filteredHasData ? formatCurrency(inventoryMetrics.purchases) : '₹0'],
              ['Transport Cost', filteredHasData ? formatCurrency(inventoryMetrics.transportCost) : '₹0'],
              ['Low Stock', filteredHasData ? String(inventoryMetrics.lowStock) : '0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!filteredHasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">{hasData ? 'No data in this date range' : 'No report data available yet'}</div></div>}
        </div>

        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Profit Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Revenue', filteredHasData ? formatCurrency(profitMetrics.revenue) : '₹0'],
              ['Product Cost', filteredHasData ? formatCurrency(profitMetrics.productCost) : '₹0'],
              ['Transport Cost', filteredHasData ? formatCurrency(profitMetrics.transportCost) : '₹0'],
              ['Estimated Profit', filteredHasData ? formatCurrency(profitMetrics.estimatedProfit) : '₹0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!filteredHasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">{hasData ? 'No data in this date range' : 'No report data available yet'}</div></div>}
        </div>
      </div>
    </div>
  )
}
