export type InventoryItem = {
  id: string
  date: string
  productId: string
  productName: string
  quantity: number
  costPerSheet: number
  sellingCost: number
  transportCost: number
  type: string
  materialCost: number
  totalCost: number
  createdAt?: string
}

export type ProductMasterItem = {
  id: string
  productId: string
  productName: string
  category: string
  unit: string
  defaultCost: number
  defaultSellingPrice: number
  minimumStockLevel: number
  createdAt: string
}

export type SaleProduct = {
  id: string
  name: string
  quantity: number
  selling: number
}

export type SaleRecord = {
  id: string
  customerName: string
  mobile: string
  saleDate: string
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial'
  discount: number
  amountPaid: number
  products: SaleProduct[]
  totalPlates: number
  subtotal: number
  grandTotal: number
  remaining: number
  createdAt: string
}

const INVENTORY_KEY = 'sai-gayatri-inventory'
const PRODUCTS_KEY = 'sai-gayatri-products'
const SALES_KEY = 'sai-gayatri-sales'

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return

  localStorage.setItem(key, JSON.stringify(value))
}

export function getInventoryItems() {
  return readStorage<InventoryItem[]>(INVENTORY_KEY, [])
}

export function saveInventoryItems(items: InventoryItem[]) {
  writeStorage(INVENTORY_KEY, items)
}

export function getProductMasterItems() {
  return readStorage<ProductMasterItem[]>(PRODUCTS_KEY, [])
}

export function saveProductMasterItems(items: ProductMasterItem[]) {
  writeStorage(PRODUCTS_KEY, items)
}

export function getSalesRecords() {
  return readStorage<SaleRecord[]>(SALES_KEY, [])
}

export function saveSalesRecords(items: SaleRecord[]) {
  writeStorage(SALES_KEY, items)
}

export function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}
