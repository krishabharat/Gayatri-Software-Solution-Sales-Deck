import { useEffect, useState, type ReactNode } from 'react'
import { getProductMasterItems, saveProductMasterItems, type ProductMasterItem } from '../utils/storage'

export default function ProductMaster() {
  const [products, setProducts] = useState<ProductMasterItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    category: '',
    unit: '',
    defaultCost: '',
    defaultSellingPrice: '',
    minimumStockLevel: ''
  })

  useEffect(() => {
    setProducts(getProductMasterItems())
  }, [])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const nextProduct: ProductMasterItem = {
      id: `${Date.now()}`,
      productId: form.productId.trim(),
      productName: form.productName.trim() || 'Unnamed Product',
      category: form.category.trim() || 'General',
      unit: form.unit.trim() || 'Sheet',
      defaultCost: Number(form.defaultCost || 0),
      defaultSellingPrice: Number(form.defaultSellingPrice || 0),
      minimumStockLevel: Number(form.minimumStockLevel || 0),
      createdAt: new Date().toISOString()
    }

    const nextProducts = [...products, nextProduct]
    setProducts(nextProducts)
    saveProductMasterItems(nextProducts)
    setForm({
      productId: '',
      productName: '',
      category: '',
      unit: '',
      defaultCost: '',
      defaultSellingPrice: '',
      minimumStockLevel: ''
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const nextProducts = products.filter((product) => product.id !== id)
    setProducts(nextProducts)
    saveProductMasterItems(nextProducts)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Inventory master</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">Product Master</h2>
        </div>
        <button type="button" onClick={() => setShowForm((p) => !p)} className="primary-btn w-full sm:w-auto">+ Add Product</button>
      </header>

      {showForm && (
        <div className="app-surface p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="form-label">Product ID</label>
              <input value={form.productId} onChange={(e) => handleChange('productId', e.target.value)} className="form-input" placeholder="Product ID" />
            </div>
            <div>
              <label className="form-label">Product Name</label>
              <input value={form.productName} onChange={(e) => handleChange('productName', e.target.value)} className="form-input" placeholder="Product Name" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="form-input" placeholder="Category" />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <input value={form.unit} onChange={(e) => handleChange('unit', e.target.value)} className="form-input" placeholder="Unit" />
            </div>
            <div>
              <label className="form-label">Default Cost</label>
              <input type="number" min={0} value={form.defaultCost} onChange={(e) => handleChange('defaultCost', e.target.value)} className="form-input" placeholder="₹0" />
            </div>
            <div>
              <label className="form-label">Default Selling Price</label>
              <input type="number" min={0} value={form.defaultSellingPrice} onChange={(e) => handleChange('defaultSellingPrice', e.target.value)} className="form-input" placeholder="₹0" />
            </div>
            <div>
              <label className="form-label">Minimum Stock Level</label>
              <input type="number" min={0} value={form.minimumStockLevel} onChange={(e) => handleChange('minimumStockLevel', e.target.value)} className="form-input" placeholder="0" />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="secondary-btn">Cancel</button>
            <button type="button" onClick={handleSave} className="primary-btn">Save Product</button>
          </div>
        </div>
      )}

      <div className="app-surface p-5 sm:p-6">
        {products.length === 0 ? (
          <EmptyState
            title="No products added yet"
            description="Create products to manage your inventory and sales."
            cta={<button type="button" onClick={() => setShowForm(true)} className="primary-btn">+ Add Product</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Product ID</th>
                  <th className="py-3 pr-4">Product Name</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Unit</th>
                  <th className="py-3 pr-4">Default Cost</th>
                  <th className="py-3 pr-4">Selling Price</th>
                  <th className="py-3 pr-4">Min Stock</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-[#edf3f2]">
                    <td className="py-3 pr-4 font-medium">{product.productId}</td>
                    <td className="py-3 pr-4">{product.productName}</td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4">{product.unit}</td>
                    <td className="py-3 pr-4">₹{product.defaultCost.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">₹{product.defaultSellingPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">{product.minimumStockLevel}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button type="button" className="muted-btn">Edit</button>
                        <button type="button" onClick={() => handleDelete(product.id)} className="muted-btn">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, description, cta }: { title: string; description: string; cta: ReactNode }) {
  return (
    <div className="empty-panel">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebfff8] text-xl text-[#0f6b63] shadow-sm">•</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  )
}
