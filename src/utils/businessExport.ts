import { zipSync, strToU8 } from 'fflate'
import type { BusinessExpense, Customer, InventoryItem, OrderQuery, ProductMasterItem, SaleRecord, Supplier } from './storage'

type Cell = string | number | boolean | null | undefined
type Sheet = { name: string; rows: Cell[][] }

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

function columnName(column: number) {
  let name = ''
  let current = column
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function worksheetXml(rows: Cell[][]) {
  const xmlRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      if (value === null || value === undefined || value === '') return ''
      const reference = `${columnName(columnIndex + 1)}${rowIndex + 1}`
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `<c r="${reference}"><v>${value}</v></c>`
      }
      if (typeof value === 'boolean') {
        return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`
      }
      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`
    }).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>`
}

function workbookFiles(sheets: Sheet[]) {
  const contentOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('')
  const sheetEntries = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join('')
  const relationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join('')

  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${contentOverrides}</Types>`),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`)
  }

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(worksheetXml(sheet.rows))
  })
  return files
}

function createSheets(data: BusinessExportData): Sheet[] {
  const saleRows: Cell[][] = [[
    'Invoice ID', 'Sale Date', 'Customer', 'Mobile', 'Payment Status', 'Total Plates',
    'Subtotal', 'Discount', 'Grand Total', 'Amount Paid', 'Remaining'
  ]]
  const saleItemRows: Cell[][] = [[
    'Invoice ID', 'Sale Date', 'Customer', 'Mobile', 'Product ID', 'Product Name',
    'Quantity', 'Purchase Cost / Unit', 'Selling Price / Unit', 'Line Total', 'Line Cost', 'Line Profit'
  ]]

  for (const sale of data.sales) {
    saleRows.push([
      sale.id, sale.saleDate, sale.customerName, sale.mobile, sale.paymentStatus, sale.totalPlates,
      sale.subtotal, sale.discount, sale.grandTotal, sale.amountPaid, sale.remaining
    ])
    for (const product of sale.products) {
      const lineTotal = product.quantity * product.selling
      const lineCost = product.quantity * product.purchaseCost
      saleItemRows.push([
        sale.id, sale.saleDate, sale.customerName, sale.mobile, product.id, product.name,
        product.quantity, product.purchaseCost, product.selling, lineTotal, lineCost, lineTotal - lineCost
      ])
    }
  }

  const queryRows: Cell[][] = [[
    'Query ID', 'Related Sale / Invoice ID', 'Customer', 'Mobile', 'Order Date',
    'Delivery Date', 'Stage', 'Payment Method', 'Advance Payment', 'Total Plates',
    'Grand Total', 'Remaining'
  ]]
  const queryItemRows: Cell[][] = [[
    'Query ID', 'Customer', 'Product ID', 'Product Name', 'Quantity',
    'Purchase Cost / Unit', 'Selling Price / Unit'
  ]]

  for (const query of data.queries) {
    queryRows.push([
      query.id, query.saleId || '', query.customerName, query.mobile, query.orderDate,
      query.deliveryDate, query.stage, query.paymentMethod, query.advancePayment,
      query.totalPlates, query.grandTotal, query.remaining
    ])
    for (const product of query.products) {
      queryItemRows.push([
        query.id, query.customerName, product.id, product.name, product.quantity,
        product.purchaseCost, product.selling
      ])
    }
  }

  return [
    { name: 'Sales and Invoices', rows: saleRows },
    { name: 'Invoice Items', rows: saleItemRows },
    {
      name: 'Inventory',
      rows: [
        ['Record ID', 'Date', 'Product ID', 'Product Name', 'Supplier', 'Quantity', 'Cost Per Sheet', 'Selling Cost', 'Transport Cost', 'Type', 'Material Cost', 'Total Cost'],
        ...data.inventory.map((item) => [
          item.id, item.date, item.productId, item.productName, item.supplierName || '',
          item.quantity, item.costPerSheet, item.sellingCost, item.transportCost,
          item.type, item.materialCost, item.totalCost
        ])
      ]
    },
    {
      name: 'Expenses',
      rows: [
        ['Expense ID', 'Date', 'Category', 'Amount', 'Note'],
        ...data.expenses.map((item) => [item.id, item.date, item.category, item.amount, item.note])
      ]
    },
    { name: 'Queries and Orders', rows: queryRows },
    { name: 'Query Items', rows: queryItemRows },
    {
      name: 'Customers',
      rows: [['Customer ID', 'Name', 'Mobile', 'Created At'], ...data.customers.map((item) => [item.id, item.name, item.mobile, item.createdAt])]
    },
    {
      name: 'Suppliers',
      rows: [['Supplier ID', 'Name', 'Mobile', 'Created At'], ...data.suppliers.map((item) => [item.id, item.name, item.mobile || '', item.createdAt])]
    },
    {
      name: 'Product Master',
      rows: [
        ['Record ID', 'Product ID', 'Product Name', 'Category', 'Unit', 'Default Cost', 'Default Selling Price', 'Minimum Stock Level'],
        ...data.products.map((item) => [
          item.id, item.productId, item.productName, item.category, item.unit,
          item.defaultCost, item.defaultSellingPrice, item.minimumStockLevel
        ])
      ]
    }
  ]
}

function downloadFile(filename: string, content: Blob) {
  const url = URL.createObjectURL(content)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export type BusinessExportData = {
  sales: SaleRecord[]
  inventory: InventoryItem[]
  expenses: BusinessExpense[]
  queries: OrderQuery[]
  customers: Customer[]
  suppliers: Supplier[]
  products: ProductMasterItem[]
}

export type MonthlyReportWorkbookData = {
  month: string
  sales: SaleRecord[]
  inventory: InventoryItem[]
  expenses: BusinessExpense[]
  currentStock: Array<{ productId: string; productName: string; unit: string; quantity: number; averageCost: number }>
}

export function downloadInventoryStockHistoryWorkbook(
  records: InventoryItem[],
  products: Array<Pick<ProductMasterItem, 'productId' | 'productName' | 'unit'> & { stockOnHand: number }>
) {
  const orderedRecords = [...records].sort((left, right) =>
    left.date.localeCompare(right.date) ||
    left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' }) ||
    String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
  )
  const productSummary = [...products].sort((left, right) =>
    left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' })
  )
  const totalCost = orderedRecords.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
  const rows: Cell[][] = [
    ['SAI GAYATRI INDUSTRIES', 'Complete Inventory Stock History'],
    ['Products', productSummary.length, 'Stock Receipts', orderedRecords.length, 'Total Recorded Cost', totalCost],
    [],
    ['Date', 'Product ID', 'Product Name', 'Unit', 'Receipt Reference', 'Supplier', 'Type', 'Quantity Received', 'Cost / Unit', 'Selling Price / Unit', 'Material Cost', 'Transport Cost', 'Total Cost', 'Notes'],
    ...orderedRecords.map((item) => {
      const product = productSummary.find((entry) =>
        (item.productId && entry.productId.trim().toLocaleLowerCase() === item.productId.trim().toLocaleLowerCase()) ||
        (!item.productId && entry.productName.trim().toLocaleLowerCase() === item.productName.trim().toLocaleLowerCase())
      )
      return [
        item.date, item.productId, item.productName, product?.unit || 'Sheet',
        item.intakeBatchId || item.id, item.supplierName || '', item.type,
        item.quantity, item.costPerSheet, item.sellingCost, item.materialCost,
        item.transportCost, item.totalCost, item.notes || ''
      ]
    })
  ]
  const summaryRows: Cell[][] = [
    ['Product ID', 'Product Name', 'Unit', 'Current Stock'],
    ...productSummary.map((product) => [product.productId, product.productName, product.unit, product.stockOnHand])
  ]
  const workbook = zipSync(workbookFiles([
    { name: 'All Stock History', rows },
    { name: 'Current Stock by Product', rows: summaryRows }
  ]), { level: 6 })
  const dateStamp = new Date().toISOString().slice(0, 10)
  downloadFile(
    `Sai-Gayatri-Complete-Inventory-History-${dateStamp}.xlsx`,
    new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  )
}

export function downloadBusinessWorkbook(data: BusinessExportData) {
  const workbook = zipSync(workbookFiles(createSheets(data)), { level: 6 })
  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  downloadFile(
    `Sai-Gayatri-Industries-Backup-${dateStamp}.xlsx`,
    new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  )
}

export function downloadMonthlyReportWorkbook(data: MonthlyReportWorkbookData) {
  const revenue = data.sales.reduce((sum, sale) => sum + sale.grandTotal, 0)
  const totalPlates = data.sales.reduce((sum, sale) => sum + sale.totalPlates, 0)
  const productCost = data.sales.reduce(
    (sum, sale) => sum + sale.products.reduce((saleCost, product) => saleCost + product.quantity * product.purchaseCost, 0),
    0
  )
  const expenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const received = data.inventory.reduce((sum, item) => sum + item.quantity, 0)
  const purchaseCost = data.inventory.reduce((sum, item) => sum + item.totalCost, 0)
  const transportCost = data.inventory.reduce((sum, item) => sum + item.transportCost, 0)
  const estimatedStockValue = data.currentStock.reduce((sum, item) => sum + item.quantity * item.averageCost, 0)
  const salesSummary: Cell[][] = [[
    'Invoice ID', 'Sale Date', 'Customer', 'Mobile', 'Products', 'Total Plates',
    'Subtotal', 'Discount', 'Revenue', 'Amount Paid', 'Remaining', 'Payment Status',
    'Product Cost', 'Estimated Profit'
  ]]
  const salesDetails: Cell[][] = [[
    'Invoice ID', 'Sale Date', 'Customer', 'Product ID', 'Product Name', 'Quantity',
    'Selling Price / Unit', 'Gross Line Total', 'Allocated Discount', 'Net Revenue',
    'Product Cost', 'Estimated Profit'
  ]]
  for (const sale of data.sales) {
    const productCost = sale.products.reduce((sum, product) => sum + product.quantity * product.purchaseCost, 0)
    salesSummary.push([
      sale.id, sale.saleDate, sale.customerName, sale.mobile,
      sale.products.map((product) => product.name).join(', '), sale.totalPlates,
      sale.subtotal, sale.discount, sale.grandTotal, sale.amountPaid, sale.remaining,
      sale.paymentStatus, productCost, sale.grandTotal - productCost
    ])
    for (const product of sale.products) {
      const grossLineTotal = product.quantity * product.selling
      const allocatedDiscount = sale.subtotal > 0 ? sale.discount * grossLineTotal / sale.subtotal : 0
      const netRevenue = grossLineTotal - allocatedDiscount
      const lineCost = product.quantity * product.purchaseCost
      salesDetails.push([
        sale.id, sale.saleDate, sale.customerName, product.id, product.name, product.quantity,
        product.selling, grossLineTotal, allocatedDiscount, netRevenue, lineCost, netRevenue - lineCost
      ])
    }
  }
  const workbook = zipSync(workbookFiles([
    {
      name: 'Monthly Summary',
      rows: [
        ['SAI GAYATRI INDUSTRIES', `Monthly Report ${data.month}`],
        ['Metric', 'Value'],
        ['Sales invoices', data.sales.length],
        ['Plates sold', totalPlates],
        ['Sales revenue', revenue],
        ['Product cost of sales', productCost],
        ['Business expenses', expenses],
        ['Estimated profit', revenue - productCost - expenses],
        ['Stock received', received],
        ['Purchase cost of receipts', purchaseCost],
        ['Transport cost of receipts', transportCost],
        ['Current stock on hand', data.currentStock.reduce((sum, item) => sum + item.quantity, 0)],
        ['Estimated current stock value', estimatedStockValue]
      ]
    },
    { name: 'Monthly Sales', rows: salesSummary },
    { name: 'Sales Product Detail', rows: salesDetails },
    {
      name: 'Monthly Inventory In',
      rows: [
        ['Receipt ID', 'Date', 'Product ID', 'Product Name', 'Supplier', 'Quantity Received', 'Cost / Unit', 'Material Cost', 'Transport Cost', 'Total Cost', 'Type', 'Notes'],
        ...data.inventory.map((item) => [
          item.id, item.date, item.productId, item.productName, item.supplierName || '',
          item.quantity, item.costPerSheet, item.materialCost, item.transportCost,
          item.totalCost, item.type, item.notes || ''
        ])
      ]
    },
    {
      name: 'Current Stock',
      rows: [
        ['Product ID', 'Product Name', 'On Hand', 'Unit'],
        ...data.currentStock.map((item) => [item.productId, item.productName, item.quantity, item.unit])
      ]
    },
    {
      name: 'Monthly Expenses',
      rows: [
        ['Date', 'Category', 'Amount', 'Note'],
        ...data.expenses.map((expense) => [expense.date, expense.category, expense.amount, expense.note])
      ]
    }
  ]), { level: 6 })
  downloadFile(
    `Sai-Gayatri-Industries-Monthly-Report-${data.month}.xlsx`,
    new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  )
}

export function downloadBusinessJsonBackup(data: BusinessExportData) {
  const backup = {
    company: 'SAI GAYATRI INDUSTRIES',
    exportedAt: new Date().toISOString(),
    data
  }
  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  downloadFile(
    `Sai-Gayatri-Industries-Backup-${dateStamp}.json`,
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
  )
}
