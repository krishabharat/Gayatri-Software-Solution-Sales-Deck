import { supabase } from './supabase'
import type { InventoryItem, ProductMasterItem } from './storage'

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
