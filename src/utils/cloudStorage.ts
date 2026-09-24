import { supabase } from './supabase'
import type { BusinessExpense, Customer, InventoryItem, OrderQuery, ProductMasterItem, SaleProduct, SaleRecord, Supplier } from './storage'

export function describeCloudError(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const details = error as { message?: string; details?: string; hint?: string; code?: string }
    if (details.code === '42P01' || details.message?.toLowerCase().includes('does not exist')) {
      return `${fallback} The new tool tables are not installed in Supabase yet. Run the latest SQL from supabase/schema.sql, then refresh.`
    }
    if (details.code === '42501' || details.message?.toLowerCase().includes('row-level security')) {
      return `${fallback} Supabase permissions are blocking this action. Run the latest RLS policy SQL from supabase/schema.sql.`
    }
    if (details.code === '23503') {
      return `${fallback} A linked database record is missing. Check that the sales and sale_products tables were created from the latest schema.`
    }
    if (details.code === '23505') {
      return `${fallback} This sale ID already exists. Please refresh the form and try again.`
    }
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
    supplierName: String(row.supplier_name || ''),
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
    supplier_name: item.supplierName || '',
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

export async function getCloudCustomers(): Promise<Customer[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('customers').select('*').order('name')
  if (error) throw error
  return (data || []).map((row) => ({ id: String(row.id), name: String(row.name || ''), mobile: String(row.mobile || ''), createdAt: String(row.created_at || '') }))
}

export async function saveCloudCustomer(customer: Customer) {
  const client = requireSupabase()
  const { error } = await client.from('customers').upsert({ id: customer.id, name: customer.name, mobile: customer.mobile, created_at: customer.createdAt })
  if (error) throw error
}

export async function deleteCloudCustomer(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function getCloudSuppliers(): Promise<Supplier[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('suppliers').select('*').order('name')
  if (error) throw error
  return (data || []).map((row) => ({ id: String(row.id), name: String(row.name || ''), mobile: String(row.mobile || ''), createdAt: String(row.created_at || '') }))
}

export async function saveCloudSupplier(supplier: Supplier) {
  const client = requireSupabase()
  const { error } = await client.from('suppliers').upsert({ id: supplier.id, name: supplier.name, mobile: supplier.mobile || '', created_at: supplier.createdAt })
  if (error) throw error
}

export async function deleteCloudSupplier(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('suppliers').delete().eq('id', id)
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
  const [{ data: sales, error: salesError }, { data: products, error: productsError }] = await Promise.all([
    client
      .from('sales')
      .select('id, customer_name, mobile, sale_date, payment_status, discount, amount_paid, total_plates, subtotal, grand_total, remaining, created_at')
      .order('created_at', { ascending: false }),
    client
      .from('sale_products')
      .select('sale_id, product_id, product_name, quantity, purchase_cost, selling')
  ])
  if (salesError) throw salesError
  if (productsError) throw productsError

  const productsBySale = new Map<string, SaleProduct[]>()
  for (const product of products || []) {
    const saleProducts = productsBySale.get(product.sale_id) || []
    saleProducts.push({
      id: String(product.product_id),
      name: String(product.product_name || ''),
      quantity: Number(product.quantity || 0),
      purchaseCost: Number(product.purchase_cost || 0),
      selling: Number(product.selling || 0)
    })
    productsBySale.set(product.sale_id, saleProducts)
  }

  return (sales || []).map((sale) => toSaleRecord(
    sale,
    productsBySale.get(sale.id) || []
  ))
}

export async function getNextInvoiceId(saleDate: string) {
  const client = requireSupabase()
  const datePart = saleDate.replaceAll('-', '')
  const prefix = `SG${datePart}`
  const { data, error } = await client
    .from('sales')
    .select('id')
    .like('id', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1)

  if (error) throw error

  const latestId = data?.[0]?.id ? String(data[0].id) : ''
  const latestSequence = latestId.startsWith(prefix) ? Number(latestId.slice(prefix.length)) : 0
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1
  return `${prefix}${String(nextSequence).padStart(5, '0')}`
}

export async function migrateLegacySaleIds(): Promise<number> {
  const client = requireSupabase()
  const { data: sales, error: salesError } = await client
    .from('sales')
    .select('id, sale_date, created_at')
    .order('sale_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (salesError) throw salesError

  const validIdPattern = /^SG\d{8}\d{5}$/
  const usedIds = new Set((sales || []).map((sale) => String(sale.id)).filter((id) => validIdPattern.test(id)))
  const serialsByDate = new Map<string, number>()
  for (const id of usedIds) {
    const datePart = id.slice(2, 10)
    const serial = Number(id.slice(10))
    serialsByDate.set(datePart, Math.max(serialsByDate.get(datePart) || 0, serial))
  }

  let migrated = 0
  for (const sale of sales || []) {
    const oldId = String(sale.id)
    if (validIdPattern.test(oldId)) continue

    const date = String(sale.sale_date || sale.created_at || '').slice(0, 10)
    const datePart = date.replaceAll('-', '')
    if (!/^\d{8}$/.test(datePart)) continue

    let serial = (serialsByDate.get(datePart) || 0) + 1
    let newId = `SG${datePart}${String(serial).padStart(5, '0')}`
    while (usedIds.has(newId)) {
      serial += 1
      newId = `SG${datePart}${String(serial).padStart(5, '0')}`
    }
    serialsByDate.set(datePart, serial)
    usedIds.add(newId)

    const { data: products, error: productsReadError } = await client
      .from('sale_products')
      .select('id, product_id')
      .eq('sale_id', oldId)
    if (productsReadError) throw productsReadError

    const { error: productLinkError } = await client
      .from('sale_products')
      .update({ sale_id: newId })
      .eq('sale_id', oldId)
    if (productLinkError) throw productLinkError

    const { error: queryLinkError } = await client
      .from('order_queries')
      .update({ sale_id: newId })
      .eq('sale_id', oldId)
    if (queryLinkError) throw queryLinkError

    const { error: saleUpdateError } = await client
      .from('sales')
      .update({ id: newId })
      .eq('id', oldId)
    if (saleUpdateError) throw saleUpdateError

    for (const product of products || []) {
      const { error: productIdError } = await client
        .from('sale_products')
        .update({ id: `${newId}-${String(product.product_id)}` })
        .eq('id', String(product.id))
      if (productIdError) throw productIdError
    }

    migrated += 1
  }

  return migrated
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
      purchase_cost: product.purchaseCost,
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
    saleId: row.sale_id ? String(row.sale_id) : undefined,
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
  const [{ data: orders, error }, { data: products, error: productsError }] = await Promise.all([
    client.from('order_queries').select('*').order('created_at', { ascending: false }),
    client.from('order_query_products').select('*')
  ])
  if (error) throw error
  if (productsError) throw productsError
  return (orders || []).map((order) => toOrderQuery(order, (products || []).filter((item) => item.order_id === order.id).map((item) => ({
    id: String(item.product_id),
    name: String(item.product_name || ''),
    quantity: Number(item.quantity || 0),
    purchaseCost: Number(item.purchase_cost || 0),
    selling: Number(item.selling || 0)
  }))))
}

export async function saveCloudOrderQuery(order: OrderQuery) {
  const client = requireSupabase()
  const { error } = await client.from('order_queries').upsert({
    id: order.id, customer_name: order.customerName, mobile: order.mobile,
    sale_id: order.saleId || null,
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
    product_name: product.name, quantity: product.quantity, purchase_cost: product.purchaseCost, selling: product.selling
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
