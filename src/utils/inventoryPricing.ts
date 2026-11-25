import type { InventoryItem } from './storage'
import type { ProductMasterItem, SaleRecord } from './storage'

export type InventorySaleMovement = {
  saleId: string
  saleDate: string
  createdAt: string
  customerName: string
  quantity: number
  total: number
  deductedFromStock: boolean
}

export type InventoryProduct = ProductMasterItem & {
  inventoryRecords: InventoryItem[]
  salesRecords: InventorySaleMovement[]
  stockOnHand: number
  soldQuantity: number
  trackedSoldQuantity: number
  intakeCount: number
  latestCost: number | null
  latestIntakeDate: string
  averageCost: number | null
  highestCost: number | null
  lowestCost: number | null
}

function getProductKey(item: InventoryItem) {
  return item.productId.trim().toLocaleLowerCase() || item.productName.trim().toLocaleLowerCase()
}

export function getInventoryProductKey(productId: string, productName = '') {
  return productId.trim().toLocaleLowerCase() || productName.trim().toLocaleLowerCase()
}

function saleLineMatchesProduct(productId: string, productName: string, soldProductId: string, soldProductName: string) {
  const normalizedProductId = productId.trim().toLocaleLowerCase()
  const normalizedSoldId = soldProductId.trim().toLocaleLowerCase()
  if (normalizedProductId && normalizedSoldId && normalizedProductId === normalizedSoldId) return true

  return Boolean(
    productName.trim() &&
    soldProductName.trim() &&
    productName.trim().toLocaleLowerCase() === soldProductName.trim().toLocaleLowerCase()
  )
}

export function getInventoryProducts(
  inventory: InventoryItem[],
  productMasters: ProductMasterItem[] = [],
  sales: SaleRecord[] = [],
  stockTrackedSales: SaleRecord[] = sales
): InventoryProduct[] {
  const products = new Map<string, InventoryProduct>()

  for (const product of productMasters) {
    const key = getInventoryProductKey(product.productId, product.productName)
    if (!key || products.has(key)) continue
    products.set(key, {
      ...product,
      inventoryRecords: [],
      salesRecords: [],
      stockOnHand: 0,
      soldQuantity: 0,
      trackedSoldQuantity: 0,
      intakeCount: 0,
      latestCost: null,
      latestIntakeDate: '',
      averageCost: null,
      highestCost: null,
      lowestCost: null
    })
  }

  for (const item of inventory) {
    const key = getProductKey(item)
    if (!key) continue
    const product = products.get(key) || {
      id: `inventory-${key}`,
      productId: item.productId,
      productName: item.productName || 'Unnamed Product',
      category: 'General',
      unit: 'Sheet',
      defaultCost: 0,
      defaultSellingPrice: 0,
      minimumStockLevel: 0,
      createdAt: item.createdAt || `${item.date}T00:00:00.000Z`,
      inventoryRecords: [],
      salesRecords: [],
      stockOnHand: 0,
      soldQuantity: 0,
      trackedSoldQuantity: 0,
      intakeCount: 0,
      latestCost: null,
      latestIntakeDate: '',
      averageCost: null,
      highestCost: null,
      lowestCost: null
    }

    product.inventoryRecords.push(item)
    product.stockOnHand += Number(item.quantity || 0)
    product.intakeCount += 1
    products.set(key, product)
  }

  for (const product of products.values()) {
    product.inventoryRecords.sort((left, right) =>
      right.date.localeCompare(left.date) || String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    const latestIntake = product.inventoryRecords[0]
    product.latestCost = latestIntake ? Number(latestIntake.costPerSheet || 0) : null
    product.latestIntakeDate = latestIntake?.date || ''
    product.intakeCount = new Set(product.inventoryRecords.map((record) => record.intakeBatchId || record.id)).size
    const costRecords = product.inventoryRecords.filter((record) => Number(record.quantity) > 0)
    const receivedQuantity = costRecords.reduce((sum, record) => sum + Number(record.quantity), 0)
    product.averageCost = receivedQuantity > 0
      ? costRecords.reduce((sum, record) => sum + Number(record.quantity) * Number(record.costPerSheet), 0) / receivedQuantity
      : null
    const costs = product.inventoryRecords.map((record) => Number(record.costPerSheet)).filter(Number.isFinite)
    product.highestCost = costs.length ? Math.max(...costs) : null
    product.lowestCost = costs.length ? Math.min(...costs) : null
  }

  for (const product of products.values()) {
    const productId = product.productId.trim().toLocaleLowerCase()
    const productName = product.productName.trim().toLocaleLowerCase()
    const mapSaleMovement = (sale: SaleRecord, deductedFromStock: boolean) => {
      const soldLines = sale.products.filter((soldProduct) =>
        saleLineMatchesProduct(productId, productName, soldProduct.id, soldProduct.name)
      )
      if (soldLines.length === 0) return null

      return [{
        saleId: sale.id,
        saleDate: sale.saleDate,
        createdAt: sale.createdAt,
        customerName: sale.customerName,
        quantity: soldLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
        total: soldLines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.selling || 0), 0),
        deductedFromStock
      }]
    }
    const trackedSaleIds = new Set(stockTrackedSales.map((sale) => sale.id))
    product.salesRecords = sales.flatMap((sale) => mapSaleMovement(sale, trackedSaleIds.has(sale.id)) || []).sort((left, right) =>
      right.saleDate.localeCompare(left.saleDate) ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.saleId.localeCompare(left.saleId)
    )
    product.soldQuantity = product.salesRecords.reduce((sum, movement) => sum + movement.quantity, 0)
    product.trackedSoldQuantity = product.salesRecords.reduce(
      (sum, movement) => sum + (movement.deductedFromStock ? movement.quantity : 0),
      0
    )
    product.stockOnHand = product.inventoryRecords.reduce((sum, intake) => sum + Number(intake.quantity || 0), 0) - product.trackedSoldQuantity
  }

  return Array.from(products.values()).sort((left, right) =>
    left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' })
  )
}

export function getProductPriceHistory(items: InventoryItem[], productId: string, productName = '', excludeId?: string) {
  const key = getInventoryProductKey(productId, productName)
  if (!key) return []

  return items
    .filter((item) => item.id !== excludeId && getProductKey(item) === key && Number.isFinite(Number(item.costPerSheet)) && Number(item.costPerSheet) >= 0 && item.date)
    .sort((left, right) => right.date.localeCompare(left.date) || String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
}
