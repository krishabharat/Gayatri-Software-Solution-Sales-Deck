import type {
  BusinessExpense,
  Customer,
  InventoryItem,
  OrderQuery,
  ProductMasterItem,
  SaleRecord,
  Supplier
} from './storage'

export function getAIBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000'
    }
  }
  return ''
}

const AI_BACKEND_URL = getAIBaseUrl()

async function postJson(path: string, body: unknown) {
  if (!AI_BACKEND_URL) return
  try {
    await fetch(`${AI_BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch {
    // Non-blocking: backend may be offline in static preview
  }
}

async function deleteReq(path: string) {
  if (!AI_BACKEND_URL) return
  try {
    await fetch(`${AI_BACKEND_URL}${path}`, { method: 'DELETE' })
  } catch {
    // Non-blocking
  }
}

export function syncSaleToAI(sale: SaleRecord) {
  return postJson('/api/sync/sale', sale)
}

export function deleteSaleFromAI(saleId: string) {
  return deleteReq(`/api/sync/sale/${encodeURIComponent(saleId)}`)
}

export function markSalePaidInAI(saleId: string) {
  return postJson('/api/sales/mark-paid', { sale_id: saleId })
}

export function syncInventoryToAI(items: InventoryItem[]) {
  return postJson('/api/sync/inventory', items)
}

export function syncProductToAI(product: ProductMasterItem) {
  return postJson('/api/sync/product', product)
}

export function syncCustomerToAI(customer: Customer) {
  return postJson('/api/customers', {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    created_at: customer.createdAt
  })
}

export function deleteCustomerFromAI(id: string) {
  return deleteReq(`/api/customers/${encodeURIComponent(id)}`)
}

export function syncSupplierToAI(supplier: Supplier) {
  return postJson('/api/suppliers', {
    id: supplier.id,
    name: supplier.name,
    mobile: supplier.mobile || '',
    created_at: supplier.createdAt
  })
}

export function deleteSupplierFromAI(id: string) {
  return deleteReq(`/api/suppliers/${encodeURIComponent(id)}`)
}

export function syncExpenseToAI(expense: BusinessExpense) {
  return postJson('/api/sync/expense', expense)
}

export function deleteExpenseFromAI(id: string) {
  return deleteReq(`/api/sync/expense/${encodeURIComponent(id)}`)
}

export function syncOrderToAI(order: OrderQuery) {
  return postJson('/api/sync/order', order)
}

export function deleteOrderFromAI(id: string) {
  return deleteReq(`/api/sync/order/${encodeURIComponent(id)}`)
}

export async function syncFullSnapshotToAI(payload: {
  sales?: SaleRecord[]
  inventory?: InventoryItem[]
  products?: ProductMasterItem[]
  expenses?: BusinessExpense[]
  customers?: Customer[]
  suppliers?: Supplier[]
  orders?: OrderQuery[]
}) {
  try {
    const res = await fetch(`${AI_BACKEND_URL}/api/sync/full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sales: payload.sales || [],
        inventory: payload.inventory || [],
        products: payload.products || [],
        expenses: payload.expenses || [],
        customers: (payload.customers || []).map((c) => ({
          id: c.id,
          name: c.name,
          mobile: c.mobile,
          created_at: c.createdAt
        })),
        suppliers: (payload.suppliers || []).map((s) => ({
          id: s.id,
          name: s.name,
          mobile: s.mobile || '',
          created_at: s.createdAt
        })),
        orders: payload.orders || []
      })
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
