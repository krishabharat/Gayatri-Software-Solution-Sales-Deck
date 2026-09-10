import { supabase } from './supabase'
import type { BusinessExpense, InventoryItem, OrderQuery, ProductMasterItem, SaleProduct, SaleRecord } from './storage'

export function describeCloudError(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const details = error as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [details.message, details.details, details.hint, details.code].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ')
  }

  if (error instanceof Error) return error.message
  return fallback
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the Vercel environment variables and redeploy.')
  }

  return supabase
}

function toInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    date: String(row.date),
    productId: String(row.product_id || ''),
    productName: String(row.product_name || ''),
    quantity: Number(row.quantity || 0),
    costPerSheet: Number(row.cost_per_sheet || 0),
    sellingCost: Number(row.selling_cost || 0),
    transportCost: Number(row.transport_cost || 0),
    type: String(row.type || 'Purchased'),
    materialCost: Number(row.material_cost || 0),
    totalCost: Number(row.total_cost || 0),
    createdAt: row.created_at ? String(row.created_at) : undefined
  }
}

function toProductMasterItem(row: Record<string, unknown>): ProductMasterItem {
  return {
    id: String(row.id),
    productId: String(row.product_id || ''),
    productName: String(row.product_name || ''),
    category: String(row.category || 'General'),
    unit: String(row.unit || 'Sheet'),
    defaultCost: Number(row.default_cost || 0),
    defaultSellingPrice: Number(row.default_selling_price || 0),
    minimumStockLevel: Number(row.minimum_stock_level || 0),
    createdAt: String(row.created_at || new Date().toISOString())
  }
}

function toSaleRecord(row: Record<string, unknown>, products: SaleProduct[]): SaleRecord {
  return {
    id: String(row.id),
    customerName: String(row.customer_name || ''),
    mobile: String(row.mobile || ''),
    saleDate: String(row.sale_date || ''),
    paymentStatus: row.payment_status as SaleRecord['paymentStatus'],
    discount: Number(row.discount || 0),
    amountPaid: Number(row.amount_paid || 0),
    products,
    totalPlates: Number(row.total_plates || 0),
    subtotal: Number(row.subtotal || 0),
    grandTotal: Number(row.grand_total || 0),
    remaining: Number(row.remaining || 0),
    createdAt: String(row.created_at || new Date().toISOString())
  }
}

export async function getCloudInventoryItems() {
  const client = requireSupabase()
  const { data, error } = await client.from('inventory').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => toInventoryItem(row))
}

export async function saveCloudInventoryItem(item: InventoryItem) {
  const client = requireSupabase()
  const { error } = await client.from('inventory').upsert({
    id: item.id,
    date: item.date,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    cost_per_sheet: item.costPerSheet,
    selling_cost: item.sellingCost,
    transport_cost: item.transportCost,
    type: item.type,
    material_cost: item.materialCost,
    total_cost: item.totalCost,
    created_at: item.createdAt
  })
  if (error) throw error
}

export async function deleteCloudInventoryItem(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('inventory').delete().eq('id', id)
  if (error) throw error
}

export async function saveCloudProductMasterItem(item: ProductMasterItem) {
  const client = requireSupabase()
  const { error } = await client.from('products').upsert({
    id: item.id,
    product_id: item.productId,
    product_name: item.productName,
    category: item.category,
    unit: item.unit,
    default_cost: item.defaultCost,
    default_selling_price: item.defaultSellingPrice,
    minimum_stock_level: item.minimumStockLevel,
    created_at: item.createdAt
  })
  if (error) throw error
}

export async function getCloudProductMasterItems() {
  const client = requireSupabase()
  const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => toProductMasterItem(row))
}

export async function getCloudSalesRecords(): Promise<SaleRecord[]> {
  const client = requireSupabase()
  const { data: sales, error: salesError } = await client.from('sales').select('*').order('created_at', { ascending: false })
  if (salesError) throw salesError
  const { data: products, error: productsError } = await client.from('sale_products').select('*')
  if (productsError) throw productsError

  return (sales || []).map((sale) => toSaleRecord(
    sale,
    (products || [])
      .filter((product) => product.sale_id === sale.id)
      .map((product) => ({
        id: String(product.product_id),
        name: String(product.product_name || ''),
        quantity: Number(product.quantity || 0),
        selling: Number(product.selling || 0)
      }))
  ))
}

export async function saveCloudSale(sale: SaleRecord) {
  const client = requireSupabase()
  const { error: saleError } = await client.from('sales').upsert({
    id: sale.id,
    customer_name: sale.customerName,
    mobile: sale.mobile,
    sale_date: sale.saleDate,
    payment_status: sale.paymentStatus,
    discount: sale.discount,
    amount_paid: sale.amountPaid,
    total_plates: sale.totalPlates,
    subtotal: sale.subtotal,
    grand_total: sale.grandTotal,
    remaining: sale.remaining,
    created_at: sale.createdAt
  })
  if (saleError) throw saleError

  const { error: deleteProductsError } = await client.from('sale_products').delete().eq('sale_id', sale.id)
  if (deleteProductsError) throw deleteProductsError

  const { error: productsError } = await client.from('sale_products').insert(
    sale.products.map((product) => ({
      id: `${sale.id}-${product.id}`,
      sale_id: sale.id,
      product_id: product.id,
      product_name: product.name,
      quantity: product.quantity,
      selling: product.selling
    }))
  )
  if (productsError) throw productsError
}

export async function deleteCloudSale(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('sales').delete().eq('id', id)
  if (error) throw error
}

function toOrderQuery(row: Record<string, unknown>, products: OrderQuery['products']): OrderQuery {
  return {
    id: String(row.id),
    customerName: String(row.customer_name || ''),
    mobile: String(row.mobile || ''),
    withCover: Number(row.with_cover || 0),
    withoutCover: Number(row.without_cover || 0),
    orderDate: String(row.order_date || ''),
    deliveryDate: String(row.delivery_date || ''),
    stage: (row.stage || 'Order') as OrderQuery['stage'],
    paymentMethod: (row.payment_method || 'Cash') as OrderQuery['paymentMethod'],
    advancePayment: Number(row.advance_payment || 0),
    products,
    totalPlates: Number(row.total_plates || 0),
    grandTotal: Number(row.grand_total || 0),
    remaining: Number(row.remaining || 0),
    createdAt: String(row.created_at || new Date().toISOString())
  }
}

export async function getCloudOrderQueries(): Promise<OrderQuery[]> {
  const client = requireSupabase()
  const { data: orders, error } = await client.from('order_queries').select('*').order('created_at', { ascending: false })
  if (error) throw error
  const { data: products, error: productsError } = await client.from('order_query_products').select('*')
  if (productsError) throw productsError
  return (orders || []).map((order) => toOrderQuery(order, (products || []).filter((item) => item.order_id === order.id).map((item) => ({
    id: String(item.product_id),
    name: String(item.product_name || ''),
    quantity: Number(item.quantity || 0),
    selling: Number(item.selling || 0)
  }))))
}

export async function saveCloudOrderQuery(order: OrderQuery) {
  const client = requireSupabase()
  const { error } = await client.from('order_queries').upsert({
    id: order.id, customer_name: order.customerName, mobile: order.mobile,
    with_cover: order.withCover, without_cover: order.withoutCover,
    order_date: order.orderDate, delivery_date: order.deliveryDate, stage: order.stage,
    payment_method: order.paymentMethod, advance_payment: order.advancePayment,
    total_plates: order.totalPlates, grand_total: order.grandTotal,
    remaining: order.remaining, created_at: order.createdAt
  })
  if (error) throw error
  const { error: deleteError } = await client.from('order_query_products').delete().eq('order_id', order.id)
  if (deleteError) throw deleteError
  const { error: productsError } = await client.from('order_query_products').insert(order.products.map((product) => ({
    id: `${order.id}-${product.id}`, order_id: order.id, product_id: product.id,
    product_name: product.name, quantity: product.quantity, selling: product.selling
  })))
  if (productsError) throw productsError
}

export async function deleteCloudOrderQuery(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('order_queries').delete().eq('id', id)
  if (error) throw error
}

export async function getCloudBusinessExpenses(): Promise<BusinessExpense[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('business_expenses').select('*').order('date', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    id: String(row.id), date: String(row.date), category: String(row.category || ''),
    amount: Number(row.amount || 0), note: String(row.note || ''),
    createdAt: String(row.created_at || new Date().toISOString())
  }))
}

export async function saveCloudBusinessExpense(expense: BusinessExpense) {
  const client = requireSupabase()
  const { error } = await client.from('business_expenses').upsert({
    id: expense.id, date: expense.date, category: expense.category,
    amount: expense.amount, note: expense.note, created_at: expense.createdAt
  })
  if (error) throw error
}

export async function deleteCloudBusinessExpense(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('business_expenses').delete().eq('id', id)
  if (error) throw error
}
