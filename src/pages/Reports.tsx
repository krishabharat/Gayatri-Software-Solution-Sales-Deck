import { formatCurrency, getInventoryItems, getSalesRecords } from '../utils/storage'

const filters = ['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range']

export default function Reports() {
  const sales = getSalesRecords()
  const inventory = getInventoryItems()
  const hasData = sales.length > 0 || inventory.length > 0

  const salesMetrics = {
    totalSales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
    totalPlates: sales.reduce((sum, sale) => sum + sale.totalPlates, 0),
    paid: sales.filter((sale) => sale.paymentStatus === 'Paid').reduce((sum, sale) => sum + sale.grandTotal, 0),
    unpaid: sales.filter((sale) => sale.paymentStatus !== 'Paid').reduce((sum, sale) => sum + sale.remaining, 0),
    customers: new Set(sales.map((sale) => sale.customerName)).size
  }

  const inventoryMetrics = {
    totalStock: inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    inventoryValue: inventory.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    purchases: inventory.filter((item) => item.type === 'Purchased').reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    transportCost: inventory.reduce((sum, item) => sum + Number(item.transportCost || 0), 0),
    lowStock: inventory.filter((item) => Number(item.quantity || 0) <= 0).length
  }

  const profitMetrics = {
    revenue: salesMetrics.totalSales,
    productCost: sales.reduce((sum, sale) => sum + sale.products.reduce((itemSum, product) => itemSum + product.quantity * product.selling, 0), 0),
    transportCost: inventoryMetrics.transportCost,
    estimatedProfit: Math.max(0, salesMetrics.totalSales - inventoryMetrics.transportCost)
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

      <div className="app-surface p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button key={filter} className="filter-chip" type="button">{filter}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sales Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Sales', hasData ? formatCurrency(salesMetrics.totalSales) : '₹0'],
              ['Total Plates', hasData ? String(salesMetrics.totalPlates) : '0'],
              ['Paid', hasData ? formatCurrency(salesMetrics.paid) : '₹0'],
              ['Unpaid', hasData ? formatCurrency(salesMetrics.unpaid) : '₹0'],
              ['Customers', hasData ? String(salesMetrics.customers) : '0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!hasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">No report data available yet</div></div>}
        </div>

        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Inventory Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Stock', hasData ? String(inventoryMetrics.totalStock) : '0'],
              ['Inventory Value', hasData ? formatCurrency(inventoryMetrics.inventoryValue) : '₹0'],
              ['Purchases', hasData ? formatCurrency(inventoryMetrics.purchases) : '₹0'],
              ['Transport Cost', hasData ? formatCurrency(inventoryMetrics.transportCost) : '₹0'],
              ['Low Stock', hasData ? String(inventoryMetrics.lowStock) : '0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!hasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">No report data available yet</div></div>}
        </div>

        <div className="app-surface p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Profit Report</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Revenue', hasData ? formatCurrency(profitMetrics.revenue) : '₹0'],
              ['Product Cost', hasData ? formatCurrency(profitMetrics.productCost) : '₹0'],
              ['Transport Cost', hasData ? formatCurrency(profitMetrics.transportCost) : '₹0'],
              ['Estimated Profit', hasData ? formatCurrency(profitMetrics.estimatedProfit) : '₹0']
            ].map(([label, value]) => renderMetric(label, value))}
          </div>
          {!hasData && <div className="empty-panel mt-4 min-h-[140px]"><div className="text-sm text-slate-500">No report data available yet</div></div>}
        </div>
      </div>
    </div>
  )
}
