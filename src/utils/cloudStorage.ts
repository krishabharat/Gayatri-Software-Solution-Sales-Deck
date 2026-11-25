import { supabase } from './supabase'
import type { BusinessExpense, Customer, InventoryItem, OrderQuery, ProductMasterItem, SaleProduct, SaleRecord, Supplier } from './storage'
import {
  deleteCustomerFromAI,
  deleteExpenseFromAI,
  deleteOrderFromAI,
  deleteSaleFromAI,
  deleteSupplierFromAI,
  markSalePaidInAI,
  syncCustomerToAI,
  syncExpenseToAI,
  syncInventoryToAI,
  syncOrderToAI,
  syncProductToAI,
  syncSaleToAI,
  syncSupplierToAI
} from './aiSync'

function createReadCache<T>(load: () => Promise<T>) {
  let value: T | undefined
  let expiresAt = 0
  let generation = 0
  let pending: Promise<T> | null = null

  return {
    get() {
      if (value !== undefined && Date.now() < expiresAt) return Promise.resolve(value)
      if (pending) return pending

      const requestGeneration = generation
      pending = load()
        .then((result) => {
          if (generation === requestGeneration) {
            value = result
            expiresAt = Date.now() + 15_000
          }
          return result
        })
        .finally(() => {
          if (generation === requestGeneration) pending = null
        })
      return pending
    },
    invalidate() {
      generation += 1
      value = undefined
      expiresAt = 0
      pending = null
    }
  }
}

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
      return `${fallback} A product ID/name or intake record already exists. Check for a duplicate and try again.`
    }
    if (details.code === 'PGRST204' || details.message?.toLowerCase().includes('schema cache')) {
      return `${fallback} Supabase is missing a required column. Run the latest migration SQL in supabase/schema.sql, then run notify pgrst, 'reload schema'; and wait 30 seconds before retrying.`
    }
    if (details.code === 'PGRST205') {
      return `${fallback} Supabase is missing a required table. Run the latest migration SQL in supabase/schema.sql, then run notify pgrst, 'reload schema'; and wait 30 seconds before retrying.`
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

function toInventoryItem(row: Record<string, unknown>, product?: ProductMasterItem): InventoryItem {
  const quantity = Number(row.quantity || 0)
  const costPerSheet = Number(row.cost_price || 0)
  const transportCost = Number(row.transport_cost || 0)
  const materialCost = quantity * costPerSheet
  return {
    id: String(row.id),
    date: String(row.date),
    productId: product?.productId || '',
    productName: product?.productName || '',
    supplierName: String(row.supplier || ''),
    quantity,
    costPerSheet,
    sellingCost: Number(row.selling_price_at_time || 0),
    transportCost,
    type: String(row.type || 'Purchased'),
    materialCost,
    totalCost: materialCost + transportCost,
    notes: String(row.notes || ''),
    intakeBatchId: String(row.intake_batch_id || ''),
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
    image: row.image ? String(row.image) : undefined,
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

async function loadCloudInventoryItems() {
  const client = requireSupabase()
  const [{ data, error }, products] = await Promise.all([
    client.from('stock_intakes').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    getCloudProductMasterItems()
  ])
  if (error) throw error
  const productsById = new Map(products.map((product) => [product.id, product]))
  return (data || []).map((row) => {
    const product = productsById.get(String(row.product_id))
    if (!product) throw new Error(`Stock intake "${String(row.id)}" refers to a product that is missing from Product Master.`)
    return toInventoryItem(row, product)
  })
}

const inventoryCache = createReadCache(loadCloudInventoryItems)

export function getCloudInventoryItems() {
  return inventoryCache.get()
}

export async function saveCloudStockIntakes(items: InventoryItem[]) {
  if (items.length === 0) return
  const batchIds = new Set(items.map((item) => item.intakeBatchId).filter(Boolean))
  if (batchIds.size > 1) throw new Error('All rows in a stock-intake submission must belong to the same batch.')
  if (items.some((item) => item.date !== items[0].date || item.supplierName !== items[0].supplierName)) {
    throw new Error('All rows in a stock-intake submission must share one date and supplier.')
  }
  const intakeBatchId = items[0].intakeBatchId || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  const client = requireSupabase()
  const products = await getCloudProductMasterItems()
  const productsBySku = new Map(products.map((product) => [product.productId.trim().toLocaleLowerCase(), product]))
  const intakeRows = items.map((item) => {
    const product = productsBySku.get(item.productId.trim().toLocaleLowerCase())
    if (!product) throw new Error(`Product "${item.productId}" was not found. Save the product before receiving stock.`)
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error('Stock intake quantity must be greater than zero.')
    if (!Number.isFinite(item.costPerSheet) || item.costPerSheet < 0) throw new Error('Stock intake cost must be zero or greater.')
    if (!Number.isFinite(item.transportCost) || item.transportCost < 0 || !Number.isFinite(item.sellingCost) || item.sellingCost < 0) {
      throw new Error('Stock intake selling and transport prices must be zero or greater.')
    }
    return {
      id: item.id,
      product_id: product.id,
      date: item.date,
      quantity: item.quantity,
      cost_price: item.costPerSheet,
      supplier: item.supplierName || '',
      selling_price_at_time: item.sellingCost || null,
      transport_cost: item.transportCost || 0,
      type: item.type || 'Purchased',
      notes: item.notes || '',
      intake_batch_id: intakeBatchId,
      created_at: item.createdAt
    }
  })
  const { error } = await client.from('stock_intakes').insert(intakeRows)
  if (error) throw error
  inventoryCache.invalidate()
  void syncInventoryToAI(items)
}

export async function updateCloudStockIntake(item: InventoryItem) {
  if (!item.date) throw new Error('Stock receipt date is required.')
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error('Stock intake quantity must be greater than zero.')
  if (!Number.isFinite(item.costPerSheet) || item.costPerSheet < 0) throw new Error('Stock intake cost must be zero or greater.')
  if (!Number.isFinite(item.transportCost) || item.transportCost < 0 ||
    !Number.isFinite(item.sellingCost) || item.sellingCost < 0) {
    throw new Error('Stock intake selling and transport prices must be zero or greater.')
  }

  const client = requireSupabase()
  const products = await getCloudProductMasterItems()
  const product = products.find((entry) => entry.productId.trim().toLocaleLowerCase() === item.productId.trim().toLocaleLowerCase())
  if (!product) throw new Error(`Product "${item.productId}" was not found. Save the product before editing its stock receipt.`)
  const { data, error } = await client.from('stock_intakes').update({
    product_id: product.id,
    date: item.date,
    quantity: item.quantity,
    cost_price: item.costPerSheet,
    supplier: item.supplierName || '',
    selling_price_at_time: item.sellingCost || null,
    transport_cost: item.transportCost || 0,
    type: item.type || 'Purchased',
    notes: item.notes || ''
  }).eq('id', item.id).select('id').maybeSingle()
  if (error) {
    if (error.message.toLocaleLowerCase().includes('append-only')) {
      throw new Error('Stock receipt editing is not enabled in Supabase yet. Apply supabase/migrations/20261018_audited_inventory_edits.sql, then retry.')
    }
    throw error
  }
  if (!data) throw new Error(`Stock receipt "${item.id}" was not found and could not be updated.`)
  inventoryCache.invalidate()
  void syncInventoryToAI([item])
}

async function loadCloudCustomers(): Promise<Customer[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('customers').select('*').order('name')
  if (error) throw error
  return (data || []).map((row) => ({ id: String(row.id), name: String(row.name || ''), mobile: String(row.mobile || ''), createdAt: String(row.created_at || '') }))
}

const customerCache = createReadCache(loadCloudCustomers)

export function getCloudCustomers() {
  return customerCache.get()
}

export async function saveCloudCustomer(customer: Customer) {
  const client = requireSupabase()
  const { error } = await client.from('customers').upsert({ id: customer.id, name: customer.name, mobile: customer.mobile, created_at: customer.createdAt })
  if (error) throw error
  customerCache.invalidate()
  void syncCustomerToAI(customer)
}

export async function deleteCloudCustomer(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('customers').delete().eq('id', id)
  if (error) throw error
  customerCache.invalidate()
  void deleteCustomerFromAI(id)
}

async function loadCloudSuppliers(): Promise<Supplier[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('suppliers').select('*').order('name')
  if (error) throw error
  return (data || []).map((row) => ({ id: String(row.id), name: String(row.name || ''), mobile: String(row.mobile || ''), createdAt: String(row.created_at || '') }))
}

const supplierCache = createReadCache(loadCloudSuppliers)

export function getCloudSuppliers() {
  return supplierCache.get()
}

export async function saveCloudSupplier(supplier: Supplier) {
  const client = requireSupabase()
  const { error } = await client.from('suppliers').upsert({ id: supplier.id, name: supplier.name, mobile: supplier.mobile || '', created_at: supplier.createdAt })
  if (error) throw error
  supplierCache.invalidate()
  void syncSupplierToAI(supplier)
}

export async function deleteCloudSupplier(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('suppliers').delete().eq('id', id)
  if (error) throw error
  supplierCache.invalidate()
  void deleteSupplierFromAI(id)
}

export async function saveCloudProductMasterItem(item: ProductMasterItem) {
  const client = requireSupabase()
  const { error } = await client.from('products').insert({
    id: item.id,
    product_id: item.productId,
    product_name: item.productName,
    category: item.category,
    unit: item.unit,
    default_cost: item.defaultCost,
    default_selling_price: item.defaultSellingPrice,
    minimum_stock_level: item.minimumStockLevel,
    image: item.image || null,
    created_at: item.createdAt
  })
  if (error) throw error
  productCache.invalidate()
  void syncProductToAI(item)
}

export async function updateCloudProductMasterItem(item: ProductMasterItem) {
  const client = requireSupabase()
  const { data, error } = await client.from('products').update({
    product_id: item.productId,
    product_name: item.productName,
    category: item.category,
    unit: item.unit,
    default_cost: item.defaultCost,
    default_selling_price: item.defaultSellingPrice,
    minimum_stock_level: item.minimumStockLevel,
    image: item.image || null
  }).eq('id', item.id).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Product "${item.productId}" was not found and could not be updated.`)
  productCache.invalidate()
  inventoryCache.invalidate()
  void syncProductToAI(item)
}

async function loadCloudProductMasterItems() {
  const client = requireSupabase()
  const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => toProductMasterItem(row))
}

const productCache = createReadCache(loadCloudProductMasterItems)

export function getCloudProductMasterItems() {
  return productCache.get()
}

async function loadCloudSalesRecords(): Promise<SaleRecord[]> {
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

const salesCache = createReadCache(loadCloudSalesRecords)

export function getCloudSalesRecords() {
  return salesCache.get()
}

async function loadCloudStockSalesRecords() {
  const client = requireSupabase()
  const [{ data, error }, sales] = await Promise.all([
    client.from('stock_intake_settings').select('value').eq('key', 'sales_stock_tracking_started_at').single(),
    getCloudSalesRecords()
  ])
  if (error) throw error
  const trackingStartedAt = Date.parse(String(data.value))
  if (!Number.isFinite(trackingStartedAt)) throw new Error('Stock tracking start date is invalid in Supabase.')
  // Legacy inventory quantities already reflect old sales; deduct sales only from the migration cutover onward.
  return sales.filter((sale) => {
    const createdAt = Date.parse(sale.createdAt)
    if (!Number.isFinite(createdAt)) throw new Error(`Sale "${sale.id}" has an invalid creation date and cannot be included in current-stock calculations.`)
    return createdAt >= trackingStartedAt
  })
}

const stockSalesCache = createReadCache(loadCloudStockSalesRecords)

export function getCloudStockSalesRecords() {
  return stockSalesCache.get()
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
    .select('*')
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
      .select('*')
      .eq('sale_id', oldId)
    if (productsReadError) throw productsReadError

    const saleData = { ...sale }
    delete saleData.id
    const { error: copiedSaleError } = await client
      .from('sales')
      .insert({ ...saleData, id: newId })
    if (copiedSaleError) throw copiedSaleError

    if (products && products.length > 0) {
      const { error: productLinkError } = await client
        .from('sale_products')
        .update({ sale_id: newId })
        .eq('sale_id', oldId)
      if (productLinkError) throw productLinkError
    }

    const { error: queryLinkError } = await client
      .from('order_queries')
      .update({ sale_id: newId })
      .eq('sale_id', oldId)
    if (queryLinkError) throw queryLinkError

    const { error: oldSaleDeleteError } = await client
      .from('sales')
      .delete()
      .eq('id', oldId)
    if (oldSaleDeleteError) throw oldSaleDeleteError

    migrated += 1
  }

  salesCache.invalidate()
  stockSalesCache.invalidate()
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
  salesCache.invalidate()
  stockSalesCache.invalidate()
  void syncSaleToAI(sale)
}

export async function deleteCloudSale(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('sales').delete().eq('id', id)
  if (error) throw error
  salesCache.invalidate()
  stockSalesCache.invalidate()
  void deleteSaleFromAI(id)
}

export async function markCloudSalePaid(sale: Pick<SaleRecord, 'id' | 'grandTotal'>) {
  const client = requireSupabase()
  const { error } = await client
    .from('sales')
    .update({
      payment_status: 'Paid',
      amount_paid: sale.grandTotal,
      remaining: 0
    })
    .eq('id', sale.id)
  if (error) throw error
  salesCache.invalidate()
  stockSalesCache.invalidate()
  void markSalePaidInAI(sale.id)
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

async function loadCloudOrderQueries(): Promise<OrderQuery[]> {
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

const orderQueryCache = createReadCache(loadCloudOrderQueries)

export function getCloudOrderQueries() {
  return orderQueryCache.get()
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
  orderQueryCache.invalidate()
  void syncOrderToAI(order)
}

export async function deleteCloudOrderQuery(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('order_queries').delete().eq('id', id)
  if (error) throw error
  orderQueryCache.invalidate()
  void deleteOrderFromAI(id)
}

async function loadCloudBusinessExpenses(): Promise<BusinessExpense[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('business_expenses').select('*').order('date', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    id: String(row.id), date: String(row.date), category: String(row.category || ''),
    amount: Number(row.amount || 0), note: String(row.note || ''),
    createdAt: String(row.created_at || new Date().toISOString())
  }))
}

const businessExpenseCache = createReadCache(loadCloudBusinessExpenses)

export function getCloudBusinessExpenses() {
  return businessExpenseCache.get()
}

export async function saveCloudBusinessExpense(expense: BusinessExpense) {
  const client = requireSupabase()
  const { error } = await client.from('business_expenses').upsert({
    id: expense.id, date: expense.date, category: expense.category,
    amount: expense.amount, note: expense.note, created_at: expense.createdAt
  })
  if (error) throw error
  businessExpenseCache.invalidate()
  void syncExpenseToAI(expense)
}

export async function deleteCloudBusinessExpense(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('business_expenses').delete().eq('id', id)
  if (error) throw error
  businessExpenseCache.invalidate()
  void deleteExpenseFromAI(id)
}
