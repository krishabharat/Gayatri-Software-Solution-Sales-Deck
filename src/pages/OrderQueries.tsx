import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { deleteCloudOrderQuery, describeCloudError, getCloudInventoryItems, getCloudOrderQueries, getNextInvoiceId, saveCloudInventoryItem, saveCloudOrderQuery, saveCloudSale } from '../utils/cloudStorage'
import { type InventoryItem, type OrderQuery, type OrderQueryProduct, type SaleRecord } from '../utils/storage'

const stages: OrderQuery['stage'][] = ['Order', 'To Pickup', 'To Deliver', 'Delivered']

export default function OrderQueries() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('id')
  const [orders, setOrders] = useState<OrderQuery[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [withCover, setWithCover] = useState(0)
  const [withoutCover, setWithoutCover] = useState(0)
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryDate, setDeliveryDate] = useState('')
  const [stage, setStage] = useState<OrderQuery['stage']>('Order')
  const [paymentMethod, setPaymentMethod] = useState<OrderQuery['paymentMethod']>('Cash')
  const [advancePayment, setAdvancePayment] = useState(0)
  const [products, setProducts] = useState<OrderQueryProduct[]>([{ id: '', name: '', quantity: 0, purchaseCost: 0, selling: 0 }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const totals = useMemo(() => {
    const totalPlates = products.reduce((sum, product) => sum + product.quantity, 0)
    const grandTotal = products.reduce((sum, product) => sum + product.quantity * product.selling, 0)
    return { totalPlates, grandTotal, remaining: Math.max(0, grandTotal - advancePayment) }
  }, [products, advancePayment])

  const load = async () => {
    try {
      const [loadedOrders, loadedInventory] = await Promise.all([getCloudOrderQueries(), getCloudInventoryItems()])
      setOrders(loadedOrders); setInventoryItems(loadedInventory)
      const existing = editingId ? loadedOrders.find((order) => order.id === editingId) : undefined
      if (existing) {
        setCustomerName(existing.customerName); setMobile(existing.mobile); setWithCover(existing.withCover); setWithoutCover(existing.withoutCover)
        setOrderDate(existing.orderDate); setDeliveryDate(existing.deliveryDate); setStage(existing.stage); setPaymentMethod(existing.paymentMethod)
        setAdvancePayment(existing.advancePayment); setProducts(existing.products)
      }
    } catch (loadError) { setError(describeCloudError(loadError, 'Unable to load order queries.')) }
  }
  useEffect(() => { void load() }, [editingId])

  const updateProduct = (index: number, changes: Partial<OrderQueryProduct>) => {
    setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, ...changes } : product))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerName.trim() || !mobile.trim() || !orderDate || !deliveryDate || saving) return
    setSaving(true); setError('')
    try {
      const orderId = editingId || `${Date.now()}`
      const existingOrder = orders.find((order) => order.id === editingId)
      const hadSale = Boolean(existingOrder?.saleId)
      let saleId = existingOrder?.saleId
      if (stage === 'Delivered') {
        saleId = saleId || await getNextInvoiceId(orderDate)
        const sale: SaleRecord = {
          id: saleId, customerName, mobile, saleDate: orderDate,
          paymentStatus: totals.remaining <= 0 ? 'Paid' : advancePayment > 0 ? 'Partial' : 'Unpaid',
          discount: 0, amountPaid: advancePayment, products, totalPlates: totals.totalPlates,
          subtotal: totals.grandTotal, grandTotal: totals.grandTotal, remaining: totals.remaining,
          createdAt: new Date().toISOString()
        }
        await saveCloudSale(sale)
        if (!hadSale) {
          await Promise.all(inventoryItems.map((item) => {
            const soldQuantity = products.filter((product) => product.id === item.productId).reduce((sum, product) => sum + product.quantity, 0)
            return soldQuantity > 0 ? saveCloudInventoryItem({ ...item, quantity: Math.max(0, item.quantity - soldQuantity) }) : Promise.resolve()
          }))
        }
      }
      await saveCloudOrderQuery({
        id: orderId, saleId, customerName, mobile, withCover, withoutCover, orderDate, deliveryDate,
        stage, paymentMethod, advancePayment, products: products.filter((product) => product.quantity > 0),
        ...totals, createdAt: new Date().toISOString()
      })
      if (editingId) navigate('/orders')
      else {
        setCustomerName(''); setMobile(''); setWithCover(0); setWithoutCover(0); setAdvancePayment(0)
        setProducts([{ id: '', name: '', quantity: 0, purchaseCost: 0, selling: 0 }]); await load()
      }
    } catch (saveError) {
      setError(describeCloudError(saveError, 'Unable to save order query.'))
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await deleteCloudOrderQuery(id); setOrders((current) => current.filter((order) => order.id !== id)) }
    catch (deleteError) { setError(describeCloudError(deleteError, 'Unable to delete order query.')) }
  }

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Customer order management</div><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">User Query / New Order</h2></div>
      <Link to="/sales" className="secondary-btn">Back to Sales</Link>
    </header>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <form onSubmit={submit} className="app-surface space-y-6 p-5 pb-36 sm:p-6">
      <section><h3 className="section-title mb-4">Customer and delivery</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div><label className="form-label">Customer Name *</label><input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" /></div>
        <div><label className="form-label">Mobile Number *</label><input className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" inputMode="tel" /></div>
        <div><label className="form-label">Order Date *</label><input type="date" className="form-input" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></div>
        <div><label className="form-label">Delivery Date *</label><input type="date" className="form-input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
      </div></section>
      <section><h3 className="section-title mb-4">Plate requirement</h3><div className="grid gap-4 sm:grid-cols-2">
        <div><label className="form-label">With Cover</label><input type="number" min="0" className="form-input" value={withCover} onChange={(e) => setWithCover(Number(e.target.value || 0))} /></div>
        <div><label className="form-label">Without Cover</label><input type="number" min="0" className="form-input" value={withoutCover} onChange={(e) => setWithoutCover(Number(e.target.value || 0))} /></div>
      </div></section>
      <section><div className="mb-4 flex items-center justify-between"><h3 className="section-title">Products (up to 8)</h3><button type="button" className="secondary-btn" disabled={products.length >= 8} onClick={() => setProducts([...products, { id: '', name: '', quantity: 0, purchaseCost: 0, selling: 0 }])}>+ Add Product</button></div>
        <div className="space-y-3">{products.map((product, index) => <div key={index} className="grid gap-3 rounded-2xl border border-[#e3efec] bg-[#f9fffd] p-4 sm:grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_0.8fr_auto]">
          <select className="form-input" value={product.id} onChange={(e) => { const item = inventoryItems.find((option) => option.productId === e.target.value); updateProduct(index, item ? { id: item.productId, name: item.productName, purchaseCost: item.costPerSheet, selling: item.sellingCost } : { id: e.target.value }) }}>
            <option value="">Select inventory product</option>{inventoryItems.map((item) => <option key={item.id} value={item.productId}>{item.productName || item.productId}</option>)}
          </select>
          <input className="form-input" placeholder="Product name" value={product.name} onChange={(e) => updateProduct(index, { name: e.target.value })} />
          <input type="number" min="0" className="form-input" placeholder="Quantity" value={product.quantity || ''} onChange={(e) => updateProduct(index, { quantity: Number(e.target.value || 0) })} />
          <input type="number" min="0" step="0.01" className="form-input" placeholder="Purchase cost" value={product.purchaseCost || ''} onChange={(e) => updateProduct(index, { purchaseCost: Number(e.target.value || 0) })} />
          <input type="number" min="0" step="0.01" className="form-input" placeholder="Rate" value={product.selling || ''} onChange={(e) => updateProduct(index, { selling: Number(e.target.value || 0) })} />
          <button type="button" className="muted-btn text-red-600" onClick={() => setProducts(products.length > 1 ? products.filter((_, productIndex) => productIndex !== index) : products)}>Remove</button>
        </div>)}</div>
      </section>
      <section className="grid gap-4 md:grid-cols-3"><div><label className="form-label">Order Stage</label><select className="form-input" value={stage} onChange={(e) => setStage(e.target.value as OrderQuery['stage'])}>{stages.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="form-label">Payment</label><select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as OrderQuery['paymentMethod'])}><option>Cash</option><option>Online</option></select></div><div><label className="form-label">Advance Payment</label><input type="number" min="0" className="form-input" value={advancePayment} onChange={(e) => setAdvancePayment(Number(e.target.value || 0))} /></div></section>
      <section className="grid grid-cols-3 gap-3 rounded-2xl border border-[#e7f1ef] bg-[#f6fffc] p-4"><div><div className="form-label">Total Plates</div><strong>{totals.totalPlates}</strong></div><div><div className="form-label">Grand Total</div><strong>₹{totals.grandTotal.toLocaleString('en-IN')}</strong></div><div><div className="form-label">Remaining</div><strong>₹{totals.remaining.toLocaleString('en-IN')}</strong></div></section>
      <div className="fixed inset-x-0 bottom-24 z-[60] border-t border-[#eadff2] bg-white/95 p-3 shadow-[0_-12px_30px_rgba(52,31,63,0.12)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><div className="mx-auto flex max-w-[1600px] justify-end"><button className="primary-btn w-full sm:w-auto" disabled={saving || !customerName.trim() || !mobile.trim() || !deliveryDate}>{saving ? 'SAVING...' : editingId ? 'UPDATE QUERY' : stage === 'Delivered' ? 'SAVE AND CREATE SALE' : 'SAVE ORDER QUERY'}</button></div></div>
    </form>
    <section className="app-surface overflow-hidden p-5 sm:p-6"><h3 className="section-title mb-4">Order queries</h3>{orders.length === 0 ? <div className="empty-panel">No customer order queries yet</div> : <div className="space-y-3">{orders.map((order) => <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-[#e7f1ef] bg-[#f9fffd] p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>{order.customerName}</strong><div className="text-sm">{order.mobile} · {order.totalPlates} plates · Delivery {order.deliveryDate}</div></div><div className="flex flex-wrap items-center gap-2"><span className="filter-chip">{order.stage}</span><Link className="muted-btn" to={`/orders?id=${order.id}`}>Edit</Link><button className="muted-btn" onClick={() => window.print()}>Invoice</button><button className="muted-btn text-red-600" onClick={() => remove(order.id)}>Delete</button></div></div>)}</div>}</section>
  </div>
}
