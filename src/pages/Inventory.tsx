import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState/EmptyState'
import PriceHistory from '../components/Inventory/PriceHistory'
import { formatCurrency, type InventoryItem, type ProductMasterItem } from '../utils/storage'
import { getCloudInventoryItems, getCloudProductMasterItems, getCloudStockSalesRecords } from '../utils/cloudStorage'
import { getInventoryProducts } from '../utils/inventoryPricing'
import type { SaleRecord } from '../utils/storage'

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [productMasters, setProductMasters] = useState<ProductMasterItem[]>([])
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const refreshItems = async () => {
    try {
      setError('')
      const [loadedItems, loadedProducts, loadedSales] = await Promise.all([getCloudInventoryItems(), getCloudProductMasterItems(), getCloudStockSalesRecords()])
      setItems(loadedItems)
      setProductMasters(loadedProducts)
      setSales(loadedSales)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory from Supabase.')
    }
  }

  useEffect(() => {
    void refreshItems()
  }, [])

  const products = useMemo(() => getInventoryProducts(items, productMasters, sales), [items, productMasters, sales])
  const filteredProducts = useMemo(() => products.filter((product) =>
    `${product.productId} ${product.productName} ${product.category}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [products, search])
  const filteredItems = useMemo(() => items.filter((item) =>
    `${item.productId} ${item.productName} ${item.supplierName || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [items, search])
  const totalProducts = products.length
  const currentStock = products.reduce((sum, product) => sum + product.stockOnHand, 0)
  const inventoryValue = products.reduce((sum, product) => sum + product.stockOnHand * (product.averageCost || 0), 0)
  const lowStock = products.filter((product) => product.stockOnHand <= product.minimumStockLevel).length
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

      <div className="app-surface p-4">
        <label className="form-label" htmlFor="inventory-search">Search products and intake history</label>
        <input id="inventory-search" value={search} onChange={(event) => setSearch(event.target.value)} className="form-input" placeholder="Search product ID, name, category or supplier" />
      </div>

      <PriceHistory items={items} />

      <section className="app-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="section-title">Products &amp; Current Stock</h3>
            <p className="mt-1 text-sm text-slate-500">Each product appears once. Add every new delivery as a separate stock intake.</p>
          </div>
          <Link to="/inventory/add" className="primary-btn">+ Add Stock</Link>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No products in inventory yet"
            description="Create a product, then record each delivery as a stock intake."
            cta={<Link to="/inventory/add" className="primary-btn">+ Add Stock</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Product ID</th>
                  <th className="py-3 pr-4">Product Name</th>
                  <th className="py-3 pr-4">Stock on Hand</th>
                  <th className="py-3 pr-4">Stock Intakes</th>
                  <th className="py-3 pr-4">Latest Cost / Sheet</th>
                  <th className="py-3 pr-4">Latest Intake</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#edf3f2] align-top">
                    <td className="py-3 pr-4 font-medium">{product.productId || '—'}</td>
                    <td className="py-3 pr-4">{product.productName || '—'}</td>
                    <td className="py-3 pr-4">{product.stockOnHand.toLocaleString('en-IN')} {product.unit}{product.stockOnHand <= product.minimumStockLevel && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Low stock</span>}</td>
                    <td className="py-3 pr-4">{product.intakeCount}</td>
                    <td className="py-3 pr-4">{product.latestCost === null ? '—' : formatCurrency(product.latestCost)}</td>
                    <td className="py-3 pr-4">{product.latestIntakeDate || '—'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/inventory/add?productId=${encodeURIComponent(product.productId || product.productName)}`} className="muted-btn">+ Add Stock</Link>
                        <Link to={`/inventory/product-master?productId=${encodeURIComponent(product.productId || product.productName)}`} className="muted-btn">Purchase History</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No products match this search.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="app-surface p-5 sm:p-6">
        <div className="mb-4">
          <h3 className="section-title">Stock Intake History</h3>
          <p className="mt-1 text-sm text-slate-500">Every delivery stays as its own record, with its original date and purchase cost.</p>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="No stock intakes yet"
            description="Each delivery you add will be recorded here separately."
            cta={<Link to="/inventory/add" className="primary-btn">+ Add Stock</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Supplier</th>
                  <th className="py-3 pr-4">Quantity</th>
                  <th className="py-3 pr-4">Cost / Sheet</th>
                  <th className="py-3 pr-4">Transport</th>
                  <th className="py-3 pr-4">Total Cost</th>
                  <th className="py-3 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#edf3f2] align-top">
                    <td className="py-3 pr-4">{item.date}</td>
                    <td className="py-3 pr-4"><span className="font-medium">{item.productId}</span><span className="ml-2 text-slate-500">{item.productName}</span></td>
                    <td className="py-3 pr-4">{item.supplierName || '—'}</td>
                    <td className="py-3 pr-4">{Number(item.quantity || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">{formatCurrency(Number(item.costPerSheet || 0))}</td>
                    <td className="py-3 pr-4">{formatCurrency(Number(item.transportCost || 0))}</td>
                    <td className="py-3 pr-4">{formatCurrency(Number(item.totalCost || 0))}</td>
                    <td className="py-3 pr-4">{item.notes || '—'}</td>
                  </tr>
                ))}
                {filteredItems.length === 0 && items.length > 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-500">No stock intakes match this search.</td></tr>}
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
        <p className="text-sm text-slate-600">Manage product details separately from deliveries. Add a product once, then record each new delivery using <span className="font-semibold">+ Add Stock</span>.</p>
      </section>
    </div>
  )
}
