import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { describeCloudError } from '../../utils/cloudStorage'
import { downloadMonthlyReportWorkbook } from '../../utils/businessExport'
import { formatCurrency, type BusinessExpense, type InventoryItem, type SaleRecord } from '../../utils/storage'
import type { InventoryProduct } from '../../utils/inventoryPricing'

type Props = {
  sales: SaleRecord[]
  inventory: InventoryItem[]
  expenses: BusinessExpense[]
  currentStock: InventoryProduct[]
  isLoading: boolean
}

export default function MonthlyReport({ sales, inventory, expenses, currentStock, isLoading }: Props) {
  const [monthlyExporting, setMonthlyExporting] = useState(false)
  const [monthlyReportError, setMonthlyReportError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthlyData = useMemo(() => {
    const monthSales = sales.filter((sale) => sale.saleDate.startsWith(selectedMonth))
    const monthInventory = inventory.filter((item) => item.date.startsWith(selectedMonth))
    const monthExpenses = expenses.filter((expense) => expense.date.startsWith(selectedMonth))
    const productCost = monthSales.reduce(
      (sum, sale) => sum + sale.products.reduce((saleCost, product) => saleCost + product.quantity * product.purchaseCost, 0),
      0
    )
    const revenue = monthSales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const expenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const monthlyPurchases = monthInventory.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
    const monthlyTransport = monthInventory.reduce((sum, item) => sum + Number(item.transportCost || 0), 0)

    return {
      sales: monthSales,
      inventory: monthInventory,
      expenses: monthExpenses,
      currentStock,
      totalPlates: monthSales.reduce((sum, sale) => sum + sale.totalPlates, 0),
      currentOnHand: currentStock.reduce((sum, product) => sum + product.stockOnHand, 0),
      currentStockValue: currentStock.reduce(
        (sum, product) => sum + product.stockOnHand * (product.averageCost || 0),
        0
      ),
      revenue,
      productCost,
      expenseTotal,
      estimatedProfit: revenue - productCost - expenseTotal,
      monthlyPurchases,
      monthlyTransport,
      receivedQuantity: monthInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    }
  }, [currentStock, expenses, inventory, sales, selectedMonth])

  const downloadMonthlyPdf = () => {
    if (monthlyExporting) return
    setMonthlyExporting(true)
    setMonthlyReportError('')
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
      const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
      doc.setFontSize(18)
      doc.text('SAI GAYATRI INDUSTRIES', 14, 16)
      doc.setFontSize(12)
      doc.text(`Monthly Business Report — ${monthLabel}`, 14, 24)
      doc.setFontSize(9)
      doc.text(`Sales: ${formatCurrency(monthlyData.revenue)} | Plates sold: ${monthlyData.totalPlates.toLocaleString('en-IN')} | Estimated profit: ${formatCurrency(monthlyData.estimatedProfit)}`, 14, 32)
      doc.text(`Product cost: ${formatCurrency(monthlyData.productCost)} | Expenses: ${formatCurrency(monthlyData.expenseTotal)} | Stock received: ${monthlyData.receivedQuantity.toLocaleString('en-IN')} units`, 14, 38)

      autoTable(doc, {
        startY: 44,
        head: [['Invoice', 'Date', 'Customer', 'Products', 'Plates', 'Revenue', 'Product Cost', 'Est. Profit', 'Payment']],
        body: monthlyData.sales.map((sale) => {
          const cost = sale.products.reduce((sum, product) => sum + product.quantity * product.purchaseCost, 0)
          return [
            sale.id, sale.saleDate, sale.customerName, sale.products.map((product) => product.name).join(', '),
            String(sale.totalPlates), formatCurrency(sale.grandTotal), formatCurrency(cost),
            formatCurrency(sale.grandTotal - cost), sale.paymentStatus
          ]
        }),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [12, 92, 81] }
      })

      const tableBottom = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50
      autoTable(doc, {
        startY: tableBottom + 7,
        head: [['Invoice', 'Customer', 'Product ID', 'Product', 'Qty', 'Sell / Unit', 'Line Revenue', 'Product Cost', 'Est. Profit']],
        body: monthlyData.sales.flatMap((sale) => sale.products.map((product) => {
          const grossLineTotal = product.quantity * product.selling
          const discountShare = sale.subtotal > 0 ? sale.discount * grossLineTotal / sale.subtotal : 0
          const netRevenue = grossLineTotal - discountShare
          const lineCost = product.quantity * product.purchaseCost
          return [
            sale.id, sale.customerName, product.id, product.name, String(product.quantity),
            formatCurrency(product.selling), formatCurrency(netRevenue), formatCurrency(lineCost),
            formatCurrency(netRevenue - lineCost)
          ]
        })),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [12, 92, 81] }
      })

      const salesDetailBottom = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || tableBottom
      autoTable(doc, {
        startY: salesDetailBottom + 7,
        head: [['Receipt Date', 'Product ID', 'Product', 'Supplier', 'Qty Received', 'Cost / Unit', 'Transport', 'Total Cost']],
        body: monthlyData.inventory.map((item) => [
          item.date, item.productId, item.productName, item.supplierName || '—',
          String(item.quantity), formatCurrency(item.costPerSheet), formatCurrency(item.transportCost),
          formatCurrency(item.totalCost)
        ]),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [12, 92, 81] }
      })

      const inventoryTableBottom = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50
      autoTable(doc, {
        startY: inventoryTableBottom + 8,
        head: [['Expense Date', 'Category', 'Amount', 'Note']],
        body: monthlyData.expenses.map((expense) => [expense.date, expense.category, formatCurrency(expense.amount), expense.note || '—']),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [12, 92, 81] }
      })

      const expensesTableBottom = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50
      autoTable(doc, {
        startY: expensesTableBottom + 8,
        head: [['Product ID', 'Product', 'Current On Hand', 'Average Cost', 'Estimated Stock Value']],
        body: monthlyData.currentStock.map((product) => [
          product.productId, product.productName,
          `${product.stockOnHand.toLocaleString('en-IN')} ${product.unit}`,
          product.averageCost === null ? '—' : formatCurrency(product.averageCost),
          formatCurrency(product.stockOnHand * (product.averageCost || 0))
        ]),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [12, 92, 81] }
      })
      doc.save(`Sai-Gayatri-Industries-Monthly-Report-${selectedMonth}.pdf`)
    } catch (error) {
      setMonthlyReportError(describeCloudError(error, 'Unable to generate the monthly PDF report.'))
    } finally {
      setMonthlyExporting(false)
    }
  }

  const downloadMonthlyExcel = () => {
    if (monthlyExporting) return
    setMonthlyExporting(true)
    setMonthlyReportError('')
    try {
      downloadMonthlyReportWorkbook({
        month: selectedMonth,
        sales: monthlyData.sales,
        inventory: monthlyData.inventory,
        expenses: monthlyData.expenses,
        currentStock: monthlyData.currentStock.map((product) => ({
          productId: product.productId,
          productName: product.productName,
          unit: product.unit,
          quantity: product.stockOnHand,
          averageCost: product.averageCost || 0
        }))
      })
    } catch (error) {
      setMonthlyReportError(describeCloudError(error, 'Unable to generate the monthly Excel report.'))
    } finally {
      setMonthlyExporting(false)
    }
  }

  const renderMetric = (label: string, value: string) => (
    <div key={label} className="rounded-2xl border border-[#ebf3f1] bg-[#fafefc] p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-800">{value}</div>
    </div>
  )

  return (
    <section className="app-surface space-y-5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Monthly reports</div>
          <h3 className="section-title mt-1">Sales performance &amp; inventory activity</h3>
          <p className="mt-1 text-sm text-slate-500">Review recorded sales, plates sold, estimated profit, stock received, and current stock for a selected month.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="monthly-report-month" className="form-label">Report month</label>
            <input id="monthly-report-month" type="month" className="form-input sm:min-w-48" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          </div>
          <button type="button" className="primary-btn" disabled={isLoading || monthlyExporting} onClick={downloadMonthlyPdf}>
            {monthlyExporting ? 'Preparing…' : 'Download PDF'}
          </button>
          <button type="button" className="secondary-btn" disabled={isLoading || monthlyExporting} onClick={downloadMonthlyExcel}>
            {monthlyExporting ? 'Preparing…' : 'Download Excel'}
          </button>
        </div>
      </div>
      {monthlyReportError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{monthlyReportError}</div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Sales made', String(monthlyData.sales.length)],
          ['Plates sold', monthlyData.totalPlates.toLocaleString('en-IN')],
          ['Sales revenue', formatCurrency(monthlyData.revenue)],
          ['Product cost', formatCurrency(monthlyData.productCost)],
          ['Expenses', formatCurrency(monthlyData.expenseTotal)],
          ['Estimated profit', formatCurrency(monthlyData.estimatedProfit)],
          ['Stock received', `${monthlyData.receivedQuantity.toLocaleString('en-IN')} units`],
          ['Purchase & transport cost', formatCurrency(monthlyData.monthlyPurchases + monthlyData.monthlyTransport)],
          ['Current stock on hand', `${monthlyData.currentOnHand.toLocaleString('en-IN')} units`],
          ['Current stock value (estimated)', formatCurrency(monthlyData.currentStockValue)]
        ].map(([label, value]) => renderMetric(label, isLoading ? '—' : value))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e7f1ef] p-4">
          <h4 className="text-sm font-semibold text-slate-800">Monthly sales detail</h4>
          {monthlyData.sales.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No sales recorded for this month.</p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">{monthlyData.sales.length} invoices · {monthlyData.totalPlates.toLocaleString('en-IN')} plates · {formatCurrency(monthlyData.revenue)} revenue.</p>
          )}
        </div>
        <div className="rounded-xl border border-[#e7f1ef] p-4">
          <h4 className="text-sm font-semibold text-slate-800">Monthly inventory detail</h4>
          {monthlyData.inventory.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No stock receipts recorded for this month.</p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">{monthlyData.inventory.length} receipt rows · {monthlyData.receivedQuantity.toLocaleString('en-IN')} units received · {formatCurrency(monthlyData.monthlyPurchases + monthlyData.monthlyTransport)} purchase and transport cost.</p>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">Estimated profit is sales revenue minus recorded product cost and business expenses for the month. Current stock value is an estimate using weighted average recorded intake cost.</p>
    </section>
  )
}
