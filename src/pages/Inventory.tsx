import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState/EmptyState'
import { formatCurrency, type InventoryItem } from '../utils/storage'
import { deleteCloudInventoryItem, getCloudInventoryItems } from '../utils/cloudStorage'

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [error, setError] = useState('')

  const refreshItems = async () => {
    try {
      setError('')
      setItems(await getCloudInventoryItems())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory from Supabase.')
    }
  }

  useEffect(() => {
    void refreshItems()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      setError('')
      await deleteCloudInventoryItem(id)
      setItems((currentItems) => currentItems.filter((item) => item.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete inventory.')
    }
  }

  const totalProducts = items.length
  const currentStock = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const inventoryValue = items.reduce((sum, item) => sum + Number(item.totalCost || 0), 0)
  const lowStock = items.filter((item) => Number(item.quantity || 0) <= 0).length
  const transportCost = items.reduce((sum, item) => sum + Number(item.transportCost || 0), 0)

  const kpis = useMemo(
    () => [
      { label: 'Total Products', value: String(totalProducts), note: totalProducts ? 'Products tracked' : 'No products added yet' },
      { label: 'Current Stock', value: String(currentStock), note: currentStock ? 'Sheets on hand' : 'No stock data yet' },
      { label: 'Inventory Value', value: formatCurrency(inventoryValue), note: inventoryValue ? 'Current inventory value' : 'No inventory value yet' },
      { label: 'Low Stock', value: String(lowStock), note: lowStock ? 'Needs attention' : 'No alerts yet' },
      { label: 'Transport Cost', value: formatCurrency(transportCost), note: transportCost ? 'Current transport cost' : 'No transport cost yet' }
    ],
    [totalProducts, currentStock, inventoryValue, lowStock, transportCost]
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Inventory</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">Inventory Management</h2>
        </div>
        <Link to="/inventory/add" className="primary-btn w-full sm:w-auto">+ Add Inventory</Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</div>
            <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-800">{item.value}</div>
            <div className="mt-2 text-sm text-slate-500">{item.note}</div>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="app-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Inventory List</h3>
          <Link to="/inventory/add" className="primary-btn">+ Add Inventory</Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No inventory records yet"
            description="Add inventory records to begin tracking stock."
            cta={<Link to="/inventory/add" className="primary-btn">+ Add Inventory</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Product ID</th>
                  <th className="py-3 pr-4">Product Name</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Quantity</th>
                  <th className="py-3 pr-4">Cost Per Sheet</th>
                  <th className="py-3 pr-4">Selling Cost</th>
                  <th className="py-3 pr-4">Transport Cost</th>
                  <th className="py-3 pr-4">Total Cost</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[#edf3f2] align-top">
                    <td className="py-3 pr-4 font-medium">{item.productId}</td>
                    <td className="py-3 pr-4">{item.productName || '—'}</td>
                    <td className="py-3 pr-4">{item.date}</td>
                    <td className="py-3 pr-4">{item.quantity}</td>
                    <td className="py-3 pr-4">₹{Number(item.costPerSheet || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">₹{Number(item.sellingCost || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">₹{Number(item.transportCost || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">₹{Number(item.totalCost || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">{item.type}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/inventory/add?id=${item.id}`} className="muted-btn">Edit</Link>
                        <button type="button" className="muted-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="app-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Product Master</h3>
          <Link to="/inventory/product-master" className="secondary-btn">View Product Master</Link>
        </div>
        <EmptyState
          title="No products added yet"
          description="Create products to manage your inventory and sales."
          cta={<Link to="/inventory/product-master" className="secondary-btn">+ Add Product</Link>}
        />
      </section>
    </div>
  )
}
