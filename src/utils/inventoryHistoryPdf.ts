import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InventoryItem, ProductMasterItem } from './storage'

export function downloadInventoryStockHistoryPdf(
  records: InventoryItem[],
  products: Array<Pick<ProductMasterItem, 'productId' | 'productName' | 'unit'>>
) {
  const orderedRecords = [...records].sort((left, right) =>
    left.date.localeCompare(right.date) ||
    left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' }) ||
    String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
  )
  const totalCost = orderedRecords.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
  const productsWithReceipts = new Set(orderedRecords.map((item) => item.productId || item.productName)).size
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })

  doc.setFontSize(17)
  doc.text('SAI GAYATRI INDUSTRIES', 14, 16)
  doc.setFontSize(12)
  doc.text('Complete Inventory Stock History', 14, 24)
  doc.setFontSize(9)
  doc.text(`Products with receipts: ${productsWithReceipts}  |  Stock receipts: ${orderedRecords.length}  |  Recorded cost: INR ${totalCost.toFixed(2)}`, 14, 31)

  autoTable(doc, {
    startY: 37,
    head: [['Date', 'Product ID', 'Product Name', 'Unit', 'Receipt Reference', 'Supplier', 'Qty In', 'Cost / Unit', 'Selling / Unit', 'Transport', 'Total Cost', 'Notes']],
    body: orderedRecords.map((item) => {
      const product = products.find((entry) =>
        (item.productId && entry.productId.trim().toLocaleLowerCase() === item.productId.trim().toLocaleLowerCase()) ||
        (!item.productId && entry.productName.trim().toLocaleLowerCase() === item.productName.trim().toLocaleLowerCase())
      )
      return [
        item.date,
        item.productId,
        item.productName,
        product?.unit || 'Sheet',
        item.intakeBatchId || item.id,
        item.supplierName || '—',
        Number(item.quantity || 0).toLocaleString('en-IN'),
        `INR ${Number(item.costPerSheet || 0).toFixed(2)}`,
        `INR ${Number(item.sellingCost || 0).toFixed(2)}`,
        `INR ${Number(item.transportCost || 0).toFixed(2)}`,
        `INR ${Number(item.totalCost || 0).toFixed(2)}`,
        item.notes || '—'
      ]
    }),
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1.6, overflow: 'linebreak' },
    headStyles: { fillColor: [12, 92, 81] },
    didDrawPage: () => {
      doc.setFontSize(8)
      doc.text(`Generated ${new Date().toLocaleDateString('en-IN')}`, 14, doc.internal.pageSize.getHeight() - 8)
      doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 8)
    }
  })

  doc.save(`Sai-Gayatri-Complete-Inventory-History-${new Date().toISOString().slice(0, 10)}.pdf`)
}
