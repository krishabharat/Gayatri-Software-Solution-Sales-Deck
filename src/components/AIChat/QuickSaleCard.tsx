import { useEffect, useState } from 'react'
import {
  getCloudCustomers,
  getCloudProductMasterItems,
  getNextInvoiceId,
  saveCloudSale
} from '../../utils/cloudStorage'
import type { Customer, ProductMasterItem, SaleRecord } from '../../utils/storage'

const FALLBACK_PRODUCTS: ProductMasterItem[] = [
  { id: '1789021529708-product', productId: 'p12', productName: '12in plate', category: 'General', unit: 'Sheet', defaultCost: 1.35, defaultSellingPrice: 1.8, minimumStockLevel: 0, createdAt: '' },
  { id: '1789021282340-product', productId: 'p14', productName: '14in plate', category: 'General', unit: 'Sheet', defaultCost: 2.15, defaultSellingPrice: 3.0, minimumStockLevel: 0, createdAt: '' },
  { id: '1790259161722-product', productId: 'P13-OR', productName: 'Leaf plate ORGANIC', category: 'General', unit: 'Sheet', defaultCost: 4.0, defaultSellingPrice: 8.5, minimumStockLevel: 0, createdAt: '' },
  { id: '1790085837723-product', productId: 'P005', productName: 'PRASADAM BOWLES', category: 'General', unit: 'Pack', defaultCost: 0.36, defaultSellingPrice: 0.46, minimumStockLevel: 0, createdAt: '' },
  { id: '1789021851861-product', productId: 'p09', productName: 'Snackes plate', category: 'General', unit: 'Sheet', defaultCost: 0.44, defaultSellingPrice: 0.8, minimumStockLevel: 0, createdAt: '' },
  { id: '1792651460655-product', productId: 'Gp14', productName: 'Gold plate 14 in', category: 'Plate', unit: 'Sheet', defaultCost: 2.3, defaultSellingPrice: 3.0, minimumStockLevel: 400, createdAt: '' }
]

const FALLBACK_CUSTOMERS: Customer[] = [
  { id: '1791216631780', name: 'RG Catering', mobile: '8886565185', createdAt: '' },
  { id: '1791333637647', name: 'Rajesh CATRING', mobile: '+91 83749 16453', createdAt: '' },
  { id: 'customer-1793277943666', name: 'Srikanth', mobile: '91339 21335', createdAt: '' },
  { id: '1789748547043', name: 'Esware', mobile: '9492514107', createdAt: '' },
  { id: '1791216292252', name: 'Kalyani kerana', mobile: '6300451668', createdAt: '' },
  { id: '1792242923823', name: 'Kamesh Darlapudi', mobile: '9966251167', createdAt: '' },
  { id: '1792385955534', name: 'Sree Maha Lakshmi Temple ( A )', mobile: '8106920776', createdAt: '' },
  { id: '1792150074683', name: 'ADHYADI Sree Maha Lakshmi Temple ( T)', mobile: '8106920776', createdAt: '' },
  { id: '1789748628345', name: 'kartick', mobile: '8897160539', createdAt: '' },
  { id: '1791333542661', name: 'Sri Rudra Pooja Store', mobile: '+91 99085 00525', createdAt: '' },
  { id: 'customer-1792121643149', name: 'Srinu', mobile: '9502297372', createdAt: '' }
]

export interface SalePrefill {
  customerQuery?: string
  productQuery?: string
  plates?: number
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial'
}

interface QuickSaleCardProps {
  prefill?: SalePrefill | null
  onSuccess: (sale: SaleRecord, productName: string) => void
  onCancel?: () => void
}

export default function QuickSaleCard({ prefill, onSuccess, onCancel }: QuickSaleCardProps) {
  const [products, setProducts] = useState<ProductMasterItem[]>(FALLBACK_PRODUCTS)
  const [customers, setCustomers] = useState<Customer[]>(FALLBACK_CUSTOMERS)

  const [selectedProduct, setSelectedProduct] = useState<ProductMasterItem | null>(FALLBACK_PRODUCTS[0])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')

  const [plates, setPlates] = useState<string>('100')
  const [unitPrice, setUnitPrice] = useState<string>(String(FALLBACK_PRODUCTS[0].defaultSellingPrice))
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid')
  const [partialPaid, setPartialPaid] = useState<string>('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getCloudProductMasterItems().catch(() => []),
      getCloudCustomers().catch(() => [])
    ]).then(([loadedProds, loadedCusts]) => {
      const activeProds = loadedProds && loadedProds.length > 0 ? loadedProds : FALLBACK_PRODUCTS
      const activeCusts = loadedCusts && loadedCusts.length > 0 ? loadedCusts : FALLBACK_CUSTOMERS
      setProducts(activeProds)
      setCustomers(activeCusts)

      // Apply prefill if user typed details in chat
      if (prefill?.productQuery) {
        const pq = prefill.productQuery.toLowerCase()
        const matchedProd = activeProds.find(
          (p) => p.productName.toLowerCase().includes(pq) || p.productId.toLowerCase().includes(pq)
        )
        if (matchedProd) {
          setSelectedProduct(matchedProd)
          setUnitPrice(String(matchedProd.defaultSellingPrice || 0))
        }
      } else if (activeProds.length > 0) {
        setSelectedProduct(activeProds[0])
        setUnitPrice(String(activeProds[0].defaultSellingPrice || 0))
      }

      if (prefill?.customerQuery) {
        const cq = prefill.customerQuery.toLowerCase()
        const matchedCust = activeCusts.find((c) => c.name.toLowerCase().includes(cq))
        if (matchedCust) setSelectedCustomer(matchedCust)
      }

      if (prefill?.plates && prefill.plates > 0) {
        setPlates(String(prefill.plates))
      }
      if (prefill?.paymentStatus) {
        setPaymentStatus(prefill.paymentStatus)
      }
    })
  }, [prefill])

  const handleSelectProduct = (prod: ProductMasterItem) => {
    setSelectedProduct(prod)
    setUnitPrice(String(prod.defaultSellingPrice || 0))
  }

  const qty = Math.max(0, Number(plates) || 0)
  const price = Math.max(0, Number(unitPrice) || 0)
  const grandTotal = Math.round(qty * price * 100) / 100
  const amountPaid =
    paymentStatus === 'Paid'
      ? grandTotal
      : paymentStatus === 'Unpaid'
      ? 0
      : Math.min(grandTotal, Math.max(0, Number(partialPaid) || 0))
  const remaining = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100)

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.mobile && c.mobile.includes(customerSearch))
  )

  const handleSaveSale = async () => {
    if (!selectedProduct) {
      setError('Please select a product on the left.')
      return
    }
    if (!selectedCustomer) {
      setError('Please select a customer on the right.')
      return
    }
    if (qty <= 0) {
      setError('Please enter number of plates greater than 0.')
      return
    }

    setSaving(true)
    setError('')
    const today = new Date().toISOString().slice(0, 10)

    try {
      let invoiceId = ''
      try {
        invoiceId = await getNextInvoiceId(today)
      } catch {
        const dPart = today.replaceAll('-', '')
        invoiceId = `SG${dPart}${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`
      }

      const saleRecord: SaleRecord = {
        id: invoiceId,
        customerName: selectedCustomer.name,
        mobile: selectedCustomer.mobile || '000',
        saleDate: today,
        paymentStatus,
        discount: 0,
        amountPaid,
        products: [
          {
            id: selectedProduct.productId,
            name: selectedProduct.productName,
            quantity: qty,
            purchaseCost: selectedProduct.defaultCost || 0,
            selling: price
          }
        ],
        totalPlates: qty,
        subtotal: grandTotal,
        grandTotal,
        remaining,
        createdAt: new Date().toISOString()
      }

      await saveCloudSale(saleRecord)
      onSuccess(saleRecord, selectedProduct.productName)
    } catch (err: any) {
      setError(err?.message || 'Unable to save sale. Please check connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full rounded-2xl border-2 border-[#C67D3B]/45 bg-[#FFFDF9] p-4 shadow-md sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#E6D7C3] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5C3317] text-xs font-bold text-white">
            ⚡
          </span>
          <div>
            <h4 className="text-sm font-extrabold text-[#2B1810]">Quick Single Sale</h4>
            <p className="text-[11px] text-[#7A5C48]">1. Pick Product (Left) &rarr; 2. Pick Customer (Right) &rarr; 3. Plates &amp; Save</p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#E6D7C3] bg-[#FAF5EE] px-2.5 py-1 text-xs font-semibold text-[#6F452B] hover:bg-[#F3E6D5]"
          >
            Close
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Two-Column Split: LEFT = Products, RIGHT = Customers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEFT: Product List */}
        <div className="rounded-xl border border-[#E6D7C3] bg-[#FAF5EE]/65 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3317]">1. Select Product</span>
            <span className="text-[11px] font-semibold text-[#8C4A1F]">{products.length} items</span>
          </div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {products.map((prod) => {
              const active = selectedProduct?.productId === prod.productId
              return (
                <button
                  key={prod.id || prod.productId}
                  type="button"
                  onClick={() => handleSelectProduct(prod)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-[#5C3317] bg-gradient-to-r from-[#5C3317] to-[#8C4A1F] text-white shadow-sm'
                      : 'border-[#E6D7C3] bg-white text-[#2B1810] hover:border-[#C67D3B] hover:bg-[#FFFDF9]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{prod.productName}</div>
                    <div className={`text-[10px] ${active ? 'text-[#F3E6D5]' : 'text-[#7A5C48]'}`}>
                      ID: {prod.productId} · {prod.unit}
                    </div>
                  </div>
                  <div className={`text-xs font-extrabold ${active ? 'text-[#F6D5B0]' : 'text-[#8C4A1F]'}`}>
                    ₹{prod.defaultSellingPrice}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Customer List */}
        <div className="rounded-xl border border-[#E6D7C3] bg-[#FAF5EE]/65 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3317]">2. Select Customer</span>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search user..."
              className="w-32 rounded-lg border border-[#D9C3A8] bg-white px-2 py-1 text-[11px] text-[#2B1810] outline-none focus:border-[#B46528]"
            />
          </div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() =>
                setSelectedCustomer({ id: 'walkin', name: 'Walk-in Customer', mobile: '000', createdAt: '' })
              }
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                selectedCustomer?.id === 'walkin'
                  ? 'border-[#5C3317] bg-gradient-to-r from-[#5C3317] to-[#8C4A1F] text-white shadow-sm'
                  : 'border-dashed border-[#D9C3A8] bg-white text-[#5C3317] hover:border-[#C67D3B]'
              }`}
            >
              <span className="text-xs font-bold">🚶 Walk-in Customer</span>
              <span className="text-[10px] opacity-80">Cash</span>
            </button>

            {filteredCustomers.map((cust) => {
              const active = selectedCustomer?.id === cust.id
              return (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => setSelectedCustomer(cust)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-[#5C3317] bg-gradient-to-r from-[#5C3317] to-[#8C4A1F] text-white shadow-sm'
                      : 'border-[#E6D7C3] bg-white text-[#2B1810] hover:border-[#C67D3B] hover:bg-[#FFFDF9]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate text-xs font-bold">{cust.name}</div>
                    <div className={`text-[10px] ${active ? 'text-[#F3E6D5]' : 'text-[#7A5C48]'}`}>
                      {cust.mobile || 'No mobile'}
                    </div>
                  </div>
                  {active && <span className="text-xs font-bold text-[#F6D5B0]">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM: Plates Quantity, Unit Price, Paid / Unpaid, and Save Button */}
      <div className="mt-4 rounded-xl border border-[#E6D7C3] bg-[#FAF5EE] p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Plates */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5C3317]">
              3. How Many Plates?
            </label>
            <input
              type="number"
              min="1"
              value={plates}
              onChange={(e) => setPlates(e.target.value)}
              className="w-full rounded-xl border border-[#D9C3A8] bg-white px-3 py-2 text-sm font-bold text-[#2B1810] outline-none focus:border-[#B46528]"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {[100, 200, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPlates(String(preset))}
                  className="rounded-md border border-[#D9C3A8] bg-white px-2 py-0.5 text-[10px] font-bold text-[#5C3317] hover:bg-[#F3E6D5]"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5C3317]">
              Selling Price / Plate (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded-xl border border-[#D9C3A8] bg-white px-3 py-2 text-sm font-bold text-[#2B1810] outline-none focus:border-[#B46528]"
            />
            <div className="mt-1.5 text-xs font-semibold text-[#6F452B]">
              Total: <strong className="text-sm text-[#2B1810]">₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          {/* Paid / Unpaid / Partial */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5C3317]">
              4. Payment Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Paid', 'Unpaid', 'Partial'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentStatus(status)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    paymentStatus === status
                      ? status === 'Paid'
                        ? 'border-emerald-700 bg-emerald-600 text-white'
                        : status === 'Unpaid'
                        ? 'border-rose-700 bg-rose-600 text-white'
                        : 'border-amber-700 bg-amber-600 text-white'
                      : 'border-[#D9C3A8] bg-white text-[#5C3317] hover:bg-[#F3E6D5]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {paymentStatus === 'Partial' && (
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={partialPaid}
                onChange={(e) => setPartialPaid(e.target.value)}
                placeholder="Amount paid ₹"
                className="mt-1.5 w-full rounded-lg border border-[#D9C3A8] bg-white px-2.5 py-1 text-xs font-bold text-[#2B1810]"
              />
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6D7C3] pt-3">
          <div className="text-xs text-[#6F452B]">
            {selectedProduct && selectedCustomer ? (
              <span>
                <strong>{selectedCustomer.name}</strong> · {qty} × {selectedProduct.productName} ={' '}
                <strong className="text-[#2B1810]">₹{grandTotal.toLocaleString()}</strong> ({paymentStatus})
              </span>
            ) : (
              <span>Select a product and customer above to save</span>
            )}
          </div>
          <button
            type="button"
            disabled={saving || !selectedProduct || !selectedCustomer || qty <= 0}
            onClick={handleSaveSale}
            className="primary-btn px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider disabled:opacity-45"
          >
            {saving ? 'Saving Sale...' : '✓ Save Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}
