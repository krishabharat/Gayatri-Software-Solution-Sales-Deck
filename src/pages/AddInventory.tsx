import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getInventoryItems, getProductMasterItems, saveInventoryItems, saveProductMasterItems, type InventoryItem, type ProductMasterItem } from '../utils/storage'

export default function AddInventory() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('id')
  const [date, setDate] = useState('')
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [costPerSheet, setCostPerSheet] = useState(0)
  const [sellingCost, setSellingCost] = useState(0)
  const [transportCost, setTransportCost] = useState(0)
  const [type, setType] = useState('Purchased')

  const isEditing = Boolean(editingId)

  useEffect(() => {
    if (!editingId) return

    const item = getInventoryItems().find((record) => record.id === editingId)
    if (!item) return

    setDate(item.date || '')
    setProductId(item.productId || '')
    setProductName(item.productName || '')
    setQuantity(Number(item.quantity || 0))
    setCostPerSheet(Number(item.costPerSheet || 0))
    setSellingCost(Number(item.sellingCost || 0))
    setTransportCost(Number(item.transportCost || 0))
    setType(item.type || 'Purchased')
  }, [editingId])

  const materialCost = useMemo(() => quantity * costPerSheet, [quantity, costPerSheet])
  const totalCost = materialCost + transportCost

  const canSave = date && productId && quantity > 0 && costPerSheet > 0 && type

  const handleSave = () => {
    if (!canSave) return

    const existing = getInventoryItems()
    const payload: Omit<InventoryItem, 'id'> & { id?: string } = {
      id: editingId || `${Date.now()}`,
      date,
      productId,
      productName,
      quantity,
      costPerSheet,
      sellingCost,
      transportCost,
      type,
      materialCost,
      totalCost,
      createdAt: new Date().toISOString()
    }

    const nextInventory = isEditing
      ? existing.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
      : [...existing, payload as InventoryItem]

    saveInventoryItems(nextInventory)

    const productList = getProductMasterItems()
    const productExists = productList.some((item) => item.productId === productId || item.productName === productName)

    if (!productExists && (productId || productName)) {
      const nextProduct: ProductMasterItem = {
        id: `${Date.now()}-product`,
        productId,
        productName: productName || 'Unnamed Product',
        category: 'General',
        unit: 'Sheet',
        defaultCost: costPerSheet,
        defaultSellingPrice: sellingCost || costPerSheet,
        minimumStockLevel: 0,
        createdAt: new Date().toISOString()
      }

      saveProductMasterItems([...productList, nextProduct])
    }

    navigate('/inventory')
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Inventory</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">{isEditing ? 'Edit Inventory' : 'Add Inventory'}</h2>
      </header>

      <div className="app-surface p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
          </div>

          <div>
            <label className="form-label">Type *</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="form-input">
              <option value="Purchased">Purchased</option>
              <option value="Stock">Stock</option>
            </select>
          </div>

          <div>
            <label className="form-label">Product ID *</label>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} className="form-input" placeholder="Product ID" />
          </div>

          <div>
            <label className="form-label">Product Name</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} className="form-input" placeholder="Product Name" />
          </div>

          <div>
            <label className="form-label">Quantity / Number of Sheets *</label>
            <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 0))} className="form-input" placeholder="0" />
          </div>

          <div>
            <label className="form-label">Cost Per Sheet *</label>
            <input type="number" min={0} step="0.01" value={costPerSheet} onChange={(e) => setCostPerSheet(Number(e.target.value || 0))} className="form-input" placeholder="₹0" />
          </div>

          <div>
            <label className="form-label">Selling Cost</label>
            <input type="number" min={0} step="0.01" value={sellingCost} onChange={(e) => setSellingCost(Number(e.target.value || 0))} className="form-input" placeholder="₹0" />
          </div>

          <div>
            <label className="form-label">Transport Cost</label>
            <input type="number" min={0} step="0.01" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value || 0))} className="form-input" placeholder="₹0" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-[20px] border border-[#e7f1ef] bg-[#f7fffc] p-4 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Material Cost</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{materialCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Cost</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="secondary-btn" onClick={() => navigate('/inventory')}>Cancel</button>
          <button type="button" disabled={!canSave} onClick={handleSave} className={`primary-btn ${!canSave ? 'cursor-not-allowed opacity-60' : ''}`}>
            {isEditing ? 'Update Inventory' : 'Save Inventory'}
          </button>
        </div>
      </div>
    </div>
  )
}
