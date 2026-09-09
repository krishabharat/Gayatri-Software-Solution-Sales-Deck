import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ProductRow from './ProductRow'
import { getInventoryItems, getSalesRecords, saveInventoryItems, saveSalesRecords, type InventoryItem, type SaleRecord } from '../../utils/storage'

type Product = {
  id?: string
  name?: string
  quantity?: number
  selling?: number
}

const paymentOptions = ['Paid', 'Unpaid', 'Partial'] as const

export default function SaleForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('id')
  const isEditing = Boolean(editingId)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [saleDate, setSaleDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<(typeof paymentOptions)[number]>('Unpaid')
  const [amountPaid, setAmountPaid] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [products, setProducts] = useState<Product[]>([{}])

  useEffect(() => {
    setInventoryItems(getInventoryItems())

    if (!editingId) return

    const sale = getSalesRecords().find((record) => record.id === editingId)
    if (!sale) return

    setCustomerName(sale.customerName || '')
    setMobile(sale.mobile || '')
    setSaleDate(sale.saleDate || '')
    setPaymentStatus(sale.paymentStatus || 'Unpaid')
    setAmountPaid(Number(sale.amountPaid || 0))
    setDiscount(Number(sale.discount || 0))
    setProducts(
      (sale.products || []).map((product) => ({
        id: String(product.id || ''),
        name: String(product.name || ''),
        quantity: Number(product.quantity || 0),
        selling: Number(product.selling || 0)
      }))
    )
  }, [editingId])

  const maxProducts = 8

  const inventoryOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; selling: number }>()

    inventoryItems.forEach((item) => {
      const itemId = String(item.productId || '').trim()
      const itemName = String(item.productName || item.productId || '').trim()

      if (!itemId && !itemName) return

      const key = itemId || itemName
      if (!unique.has(key)) {
        unique.set(key, {
          id: itemId || itemName,
          name: itemName || itemId || 'Unnamed product',
          selling: Number(item.sellingCost || item.costPerSheet || 0)
        })
      }
    })

    return Array.from(unique.values())
  }, [inventoryItems])

  const totals = useMemo(() => {
    const totalPlates = products.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    const subtotal = products.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.selling) || 0), 0)
    const safeAmountPaid = paymentStatus === 'Paid' ? subtotal : paymentStatus === 'Partial' ? amountPaid : 0
    const grandTotal = subtotal - discount
    const remaining = Math.max(0, grandTotal - safeAmountPaid)

    return { totalPlates, subtotal, grandTotal, remaining, safeAmountPaid }
  }, [products, amountPaid, discount, paymentStatus])

  const updateProduct = (index: number, changes: Partial<Product>) => {
    setProducts((prev) => prev.map((product, itemIndex) => (itemIndex === index ? { ...product, ...changes } : product)))
  }

  const addProduct = () => {
    if (products.length >= maxProducts) return
    setProducts((prev) => [...prev, {}])
  }

  const removeProduct = (index: number) => {
    setProducts((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev))
  }

  const handleSelectInventory = (index: number, option: { id: string; name: string; selling: number }) => {
    updateProduct(index, {
      id: option.id,
      name: option.name,
      selling: option.selling
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSave) return

    const validProducts = products
      .filter((product) => Number(product.quantity) > 0)
      .map((product, index) => ({
        id: String(product.id || `product-${index + 1}`).trim(),
        name: String(product.name || `Product ${index + 1}`).trim(),
        quantity: Number(product.quantity) || 0,
        selling: Number(product.selling) || 0
      }))

    const inventory = getInventoryItems()
    const currentSale = editingId ? getSalesRecords().find((record) => record.id === editingId) : null

    if (currentSale) {
      const restoredInventory = inventory.map((item) => {
        let currentQuantity = Number(item.quantity || 0)

        currentSale.products.forEach((product) => {
          const matchesId = item.productId && product.id && item.productId.toLowerCase() === product.id.toLowerCase()
          const matchesName = !matchesId && item.productName && product.name && item.productName.toLowerCase() === product.name.toLowerCase()

          if (matchesId || matchesName) {
            currentQuantity = currentQuantity + Number(product.quantity || 0)
          }
        })

        return { ...item, quantity: currentQuantity }
      })

      const nextInventory = restoredInventory.map((item) => {
        let currentQuantity = Number(item.quantity || 0)

        validProducts.forEach((product) => {
          const matchesId = item.productId && product.id && item.productId.toLowerCase() === product.id.toLowerCase()
          const matchesName = !matchesId && item.productName && product.name && item.productName.toLowerCase() === product.name.toLowerCase()

          if (matchesId || matchesName) {
            currentQuantity = Math.max(0, currentQuantity - Number(product.quantity || 0))
          }
        })

        return { ...item, quantity: currentQuantity }
      })

      saveInventoryItems(nextInventory)
    } else {
      const nextInventory = inventory.map((item) => {
        let currentQuantity = Number(item.quantity || 0)

        validProducts.forEach((product) => {
          const matchesId = item.productId && product.id && item.productId.toLowerCase() === product.id.toLowerCase()
          const matchesName = !matchesId && item.productName && product.name && item.productName.toLowerCase() === product.name.toLowerCase()

          if (matchesId || matchesName) {
            currentQuantity = Math.max(0, currentQuantity - Number(product.quantity || 0))
          }
        })

        return { ...item, quantity: currentQuantity }
      })

      saveInventoryItems(nextInventory)
    }

    const saleRecord: SaleRecord = {
      id: editingId || `${Date.now()}`,
      customerName,
      mobile,
      saleDate,
      paymentStatus,
      discount,
      amountPaid: paymentStatus === 'Partial' ? amountPaid : totals.safeAmountPaid,
      products: validProducts,
      totalPlates: totals.totalPlates,
      subtotal: totals.subtotal,
      grandTotal: totals.grandTotal,
      remaining: totals.remaining,
      createdAt: new Date().toISOString()
    }

    const existingSales = getSalesRecords()
    const nextSales = editingId
      ? existingSales.map((sale) => (sale.id === editingId ? saleRecord : sale))
      : [saleRecord, ...existingSales]

    saveSalesRecords(nextSales)
    navigate('/sales')
  }

  const canSave =
    customerName.trim() !== '' &&
    mobile.trim() !== '' &&
    saleDate.trim() !== '' &&
    products.some((product) => Number(product.quantity) > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="form-label">Customer Name *</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="form-input" placeholder="Customer Name" />
        </div>
        <div>
          <label className="form-label">Mobile Number *</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="form-input" placeholder="Mobile Number" />
        </div>

        <div>
          <label className="form-label">Sale Date *</label>
          <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="form-input" />
        </div>

        <div>
          <label className="form-label">Payment Status</label>
          <div className="flex gap-2 rounded-2xl border border-[#dfeae7] bg-[#f8fffd] p-1.5">
            {paymentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPaymentStatus(option)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  paymentStatus === option ? 'bg-[#0f6b63] text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {paymentStatus === 'Partial' && (
          <>
            <div>
              <label className="form-label">Amount Paid</label>
              <input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value || 0))} className="form-input" placeholder="₹0" />
            </div>
            <div>
              <label className="form-label">Remaining Amount</label>
              <div className="flex h-[46px] items-center rounded-xl border border-[#dfeae7] bg-white px-3 text-sm font-semibold text-slate-700">
                ₹{totals.remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="section-title">Products</h3>
          <div className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">1 to 8</div>
        </div>

        <div className="space-y-3">
          {products.map((product, index) => (
            <ProductRow
              key={index}
              index={index}
              product={product}
              inventoryOptions={inventoryOptions}
              onChange={updateProduct}
              onRemove={removeProduct}
              onSelectInventory={handleSelectInventory}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={addProduct} disabled={products.length >= maxProducts} className={`primary-btn ${products.length >= maxProducts ? 'cursor-not-allowed opacity-60' : ''}`}>
            + Add Product
          </button>
          {products.length >= maxProducts && <div className="text-sm text-slate-500">Maximum 8 products per sale</div>}
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e7f1ef] bg-[#f6fffc] p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Plates</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">{totals.totalPlates}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Subtotal</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Discount</div>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value || 0))} className="form-input mt-2" placeholder="₹0" />
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Grand Total</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount Paid</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{totals.safeAmountPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Remaining</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">₹{totals.remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="secondary-btn" onClick={() => navigate('/sales')}>Cancel</button>
        <button type="submit" disabled={!canSave} className={`primary-btn ${!canSave ? 'cursor-not-allowed opacity-60' : ''}`}>
          {isEditing ? 'UPDATE SALE' : 'SAVE SALE'}
        </button>
      </div>
    </form>
  )
}
