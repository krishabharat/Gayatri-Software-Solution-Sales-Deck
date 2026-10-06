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

export function downloadBusinessWorkbook(data: BusinessExportData) {
  const workbook = zipSync(workbookFiles(createSheets(data)), { level: 6 })
  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  downloadFile(
    `Sai-Gayatri-Industries-Backup-${dateStamp}.xlsx`,
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
