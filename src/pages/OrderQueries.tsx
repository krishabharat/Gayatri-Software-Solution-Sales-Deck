import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { deleteCloudOrderQuery, describeCloudError, getCloudCustomers, getCloudInventoryItems, getCloudOrderQueries, getNextInvoiceId, saveCloudCustomer, saveCloudOrderQuery, saveCloudSale } from '../utils/cloudStorage'
import { formatCurrency, type Customer, type InventoryItem, type OrderQuery, type OrderQueryProduct, type SaleRecord } from '../utils/storage'

const stages: OrderQuery['stage'][] = ['Order', 'To Pickup', 'To Deliver', 'Delivered', 'Cancelled']

function localDateInputValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function OrderQueries() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('id')
  const [orders, setOrders] = useState<OrderQuery[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [withCover, setWithCover] = useState(0)
  const [withoutCover, setWithoutCover] = useState(0)
  const [orderDate, setOrderDate] = useState(localDateInputValue)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [stage, setStage] = useState<OrderQuery['stage']>('Order')
  const [paymentMethod, setPaymentMethod] = useState<OrderQuery['paymentMethod']>('Cash')
  const [advancePayment, setAdvancePayment] = useState(0)
  const [products, setProducts] = useState<OrderQueryProduct[]>([{ id: '', name: '', quantity: 0, purchaseCost: 0, selling: 0 }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingImageId, setDownloadingImageId] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [failedSaleRecordIds, setFailedSaleRecordIds] = useState<string[]>([])

  const totals = useMemo(() => {
    const totalPlates = products.reduce((sum, product) => sum + product.quantity, 0)
    const grandTotal = products.reduce((sum, product) => sum + product.quantity * product.selling, 0)
    return { totalPlates, grandTotal, remaining: Math.max(0, grandTotal - advancePayment) }
  }, [products, advancePayment])

  const inventoryOptions = useMemo(() => {
    const latestProducts = new Map<string, InventoryItem>()
    ;[...inventoryItems]
      .sort((left, right) => right.date.localeCompare(left.date) || String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
      .forEach((item) => {
        const key = item.productId.trim().toLocaleLowerCase() || item.productName.trim().toLocaleLowerCase()
        if (key && !latestProducts.has(key)) latestProducts.set(key, item)
      })
    return Array.from(latestProducts.values())
  }, [inventoryItems])

  const load = async () => {
    try {
      const [loadedOrders, loadedInventory, loadedCustomers] = await Promise.all([getCloudOrderQueries(), getCloudInventoryItems(), getCloudCustomers()])
      setOrders(loadedOrders); setInventoryItems(loadedInventory); setCustomers(loadedCustomers)
      const existing = editingId ? loadedOrders.find((order) => order.id === editingId) : undefined
      if (existing) {
        const matchedCustomer = loadedCustomers.find((customer) => customer.mobile.replace(/\D/g, '') === existing.mobile.replace(/\D/g, ''))
        setSelectedCustomerId(matchedCustomer?.id || '')
        setCustomerName(matchedCustomer?.name || existing.customerName); setMobile(matchedCustomer?.mobile || existing.mobile); setWithCover(existing.withCover); setWithoutCover(existing.withoutCover)
        setOrderDate(existing.orderDate); setDeliveryDate(existing.deliveryDate); setStage(existing.stage); setPaymentMethod(existing.paymentMethod)
        setAdvancePayment(existing.advancePayment); setProducts(existing.products)
      }
    } catch (loadError) { setError(describeCloudError(loadError, 'Unable to load order queries.')) }
    finally { setIsLoading(false) }
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
      const matchedCustomer = customers.find((customer) => customer.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, ''))
      const customer: Customer = matchedCustomer || {
        id: `customer-${Date.now()}`,
        name: customerName.trim(),
        mobile: mobile.trim(),
        createdAt: new Date().toISOString()
      }
      if (!matchedCustomer) {
        await saveCloudCustomer(customer)
        setCustomers((current) => [...current, customer])
      }
      setSelectedCustomerId(customer.id)
      setCustomerName(customer.name)
      setMobile(customer.mobile)
      const orderId = editingId || `${Date.now()}`
      const existingOrder = orders.find((order) => order.id === editingId)
      let saleId = existingOrder?.saleId
      if (stage === 'Delivered') {
        saleId = saleId || await getNextInvoiceId(orderDate)
        const sale: SaleRecord = {
          id: saleId, customerName: customer.name, mobile: customer.mobile, saleDate: orderDate,
          paymentStatus: totals.remaining <= 0 ? 'Paid' : advancePayment > 0 ? 'Partial' : 'Unpaid',
          discount: 0, amountPaid: advancePayment, products, totalPlates: totals.totalPlates,
          subtotal: totals.grandTotal, grandTotal: totals.grandTotal, remaining: totals.remaining,
          createdAt: new Date().toISOString()
        }
        await saveCloudSale(sale)
      }
      await saveCloudOrderQuery({
        id: orderId, saleId, customerName: customer.name, mobile: customer.mobile, withCover, withoutCover, orderDate, deliveryDate,
        stage, paymentMethod, advancePayment, products: products.filter((product) => product.quantity > 0),
        ...totals, createdAt: new Date().toISOString()
      })
      if (editingId) navigate('/orders')
      else {
        setSelectedCustomerId(''); setCustomerName(''); setMobile(''); setWithCover(0); setWithoutCover(0); setAdvancePayment(0)
        setDeliveryDate('')
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

  const updateOrderStage = async (order: OrderQuery, nextStage: OrderQuery['stage']) => {
    if (updatingOrderId) return
    setUpdatingOrderId(order.id)
    setError('')
    try {
      const updatedOrder: OrderQuery = { ...order, stage: nextStage }
      if (nextStage === 'Delivered') {
        if (order.products.every((product) => product.quantity <= 0)) {
          throw new Error('Add at least one product with a quantity before marking this order delivered.')
        }
        updatedOrder.saleId = order.saleId || await getNextInvoiceId(order.orderDate)
        await saveCloudOrderQuery(updatedOrder)
        setOrders((current) => current.map((item) => item.id === order.id ? updatedOrder : item))

        const sale: SaleRecord = {
          id: updatedOrder.saleId,
          customerName: order.customerName,
          mobile: order.mobile,
          saleDate: order.orderDate,
          paymentStatus: order.remaining <= 0 ? 'Paid' : order.advancePayment > 0 ? 'Partial' : 'Unpaid',
          discount: 0,
          amountPaid: order.advancePayment,
          products: order.products.filter((product) => product.quantity > 0),
          totalPlates: order.totalPlates,
          subtotal: order.grandTotal,
          grandTotal: order.grandTotal,
          remaining: order.remaining,
          createdAt: order.createdAt
        }
        try {
          await saveCloudSale(sale)
          setFailedSaleRecordIds((current) => current.filter((id) => id !== order.id))
        } catch (saleError) {
          setFailedSaleRecordIds((current) => current.includes(order.id) ? current : [...current, order.id])
          throw new Error(`Order marked delivered, but its sale could not be recorded. ${describeCloudError(saleError, 'Retry the sale record.')}`)
        }
      } else {
        await saveCloudOrderQuery(updatedOrder)
        setOrders((current) => current.map((item) => item.id === order.id ? updatedOrder : item))
      }
    } catch (stageError) {
      setError(describeCloudError(stageError, 'Unable to update this customer query.'))
      try {
        setOrders(await getCloudOrderQueries())
      } catch (reloadError) {
        setError(`${describeCloudError(stageError, 'Unable to update this customer query.')} ${describeCloudError(reloadError, 'Unable to refresh customer queries.')}`)
      }
    } finally {
      setUpdatingOrderId('')
    }
  }

  const downloadQueryImage = async (order: OrderQuery) => {
    if (downloadingImageId) return
    setDownloadingImageId(order.id)
    setError('')
    try {
      const canvas = document.createElement('canvas')
      const width = 1200
      const rowHeight = 62
      const tableTop = 500
      const summaryTop = tableTop + Math.max(order.products.length, 1) * rowHeight + 56
      canvas.width = width
      canvas.height = summaryTop + 220
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Your browser could not prepare the query image.')

      const drawText = (text: string, x: number, y: number, font = '24px Arial', color = '#193a35') => {
        context.font = font
        context.fillStyle = color
        context.fillText(text, x, y, width - x - 56)
      }
      const drawRule = (y: number) => {
        context.strokeStyle = '#e2ece8'
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(56, y)
        context.lineTo(width - 56, y)
        context.stroke()
      }

      context.fillStyle = '#f4f9f7'
      context.fillRect(0, 0, width, canvas.height)
      context.fillStyle = '#0f5148'
      context.fillRect(0, 0, width, 188)
      drawText('SAI GAYATRI INDUSTRIES', 56, 78, 'bold 38px Arial', '#ffffff')
      drawText('CUSTOMER QUERY / ORDER DETAILS', 56, 132, 'bold 24px Arial', '#d8f0e9')
      drawText(`Query ID: ${order.id}`, 840, 86, '20px Arial', '#ffffff')
      if (order.saleId) drawText(`Invoice: ${order.saleId}`, 840, 128, '20px Arial', '#ffffff')

      context.fillStyle = '#ffffff'
      context.fillRect(56, 218, width - 112, 232)
      drawText('CUSTOMER', 84, 264, 'bold 18px Arial', '#637b75')
      drawText(order.customerName || '—', 84, 306, 'bold 30px Arial')
      drawText(`Mobile: ${order.mobile || '—'}`, 84, 348, '22px Arial')
      drawText('ORDER & DELIVERY', 630, 264, 'bold 18px Arial', '#637b75')
      drawText(`Order date: ${order.orderDate || '—'}`, 630, 306, '22px Arial')
      drawText(`Delivery date: ${order.deliveryDate || '—'}`, 630, 348, '22px Arial')
      drawText(`Stage: ${order.stage}`, 630, 390, '22px Arial')
      drawText(`Payment: ${order.paymentMethod}`, 630, 426, '22px Arial')
      drawText(`With cover: ${order.withCover}    Without cover: ${order.withoutCover}`, 84, 414, '22px Arial')

      context.fillStyle = '#0f5148'
      context.fillRect(56, 474, width - 112, 54)
      drawText('PRODUCT', 82, 510, 'bold 18px Arial', '#ffffff')
      drawText('QUANTITY', 650, 510, 'bold 18px Arial', '#ffffff')
      drawText('RATE', 830, 510, 'bold 18px Arial', '#ffffff')
      drawText('LINE TOTAL', 1000, 510, 'bold 18px Arial', '#ffffff')

      let rowY = tableTop + 54
      const orderProducts = order.products.length > 0 ? order.products : []
      for (const [index, product] of orderProducts.entries()) {
        context.fillStyle = index % 2 === 0 ? '#ffffff' : '#f9fcfb'
        context.fillRect(56, rowY, width - 112, rowHeight)
        drawText(product.name || product.id || 'Product', 82, rowY + 38, '22px Arial')
        drawText(`${Number(product.quantity || 0).toLocaleString('en-IN')} plates`, 650, rowY + 38, '20px Arial')
        drawText(formatCurrency(Number(product.selling || 0)), 830, rowY + 38, '20px Arial')
        drawText(formatCurrency(Number(product.quantity || 0) * Number(product.selling || 0)), 1000, rowY + 38, '20px Arial')
        rowY += rowHeight
      }
      if (orderProducts.length === 0) drawText('No product lines recorded', 82, rowY + 38, '22px Arial', '#637b75')

      const totalTop = rowY + 36
      drawRule(totalTop)
      drawText(`Total plates: ${Number(order.totalPlates || 0).toLocaleString('en-IN')}`, 84, totalTop + 54, 'bold 24px Arial')
      drawText(`Grand total: ${formatCurrency(Number(order.grandTotal || 0))}`, 84, totalTop + 100, 'bold 26px Arial')
      drawText(`Advance paid: ${formatCurrency(Number(order.advancePayment || 0))}`, 630, totalTop + 54, '22px Arial')
      drawText(`Remaining: ${formatCurrency(Number(order.remaining || 0))}`, 630, totalTop + 100, 'bold 24px Arial')
      drawRule(canvas.height - 72)
      drawText('SAI GAYATRI INDUSTRIES · CUSTOMER ORDER RECORD', 84, canvas.height - 36, '16px Arial', '#637b75')

      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('The browser could not create a PNG image for this query.'))
        }, 'image/png')
      })
      const url = URL.createObjectURL(image)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Sai-Gayatri-Query-${order.id}.png`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (imageError) {
      setError(describeCloudError(imageError, 'Unable to download the query image.'))
    } finally {
      setDownloadingImageId('')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Customer order management</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{editingId ? 'Edit Customer Query' : 'New Customer Query'}</h2>
          <p className="mt-1 text-sm text-slate-500">Capture customer requirements, product quantities, delivery, and payment in one place.</p>
        </div>
        <Link to="/sales" className="secondary-btn">Back to Sales</Link>
      </header>
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {isLoading && <div role="status" className="rounded-2xl border border-[#d9eee8] bg-[#f3fbf8] px-4 py-3 text-sm font-semibold text-[#285d50]">Loading customer and product records…</div>}
      <form onSubmit={submit} className="space-y-6 pb-32 sm:pb-0">
        <section className="app-surface p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="section-title">Customer &amp; delivery</h3>
            <p className="mt-1 text-sm text-slate-500">Select a saved customer to fill in their contact details, or enter a new customer.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label htmlFor="saved-customer" className="form-label">Saved Customer</label>
              <select
                id="saved-customer"
                className="form-input"
                value={selectedCustomerId}
                onChange={(event) => {
                  const customer = customers.find((item) => item.id === event.target.value)
                  setSelectedCustomerId(customer?.id || '')
                  setCustomerName(customer?.name || '')
                  setMobile(customer?.mobile || '')
                }}
              >
                <option value="">+ Enter a new customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.mobile}</option>)}
              </select>
              {customers.length === 0 && <p className="mt-1 text-xs text-slate-500">New customers are added to your customer list when you save this query.</p>}
            </div>
            <div>
              <label htmlFor="query-customer-name" className="form-label">Customer Name *</label>
              <input id="query-customer-name" required className="form-input" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name" readOnly={Boolean(selectedCustomerId)} />
            </div>
            <div>
              <label htmlFor="query-customer-mobile" className="form-label">Mobile Number *</label>
              <input id="query-customer-mobile" required className="form-input" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="Mobile number" inputMode="tel" readOnly={Boolean(selectedCustomerId)} />
            </div>
            <div>
              <label htmlFor="query-order-date" className="form-label">Order Date *</label>
              <input id="query-order-date" type="date" required className="form-input" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </div>
            <div>
              <label htmlFor="query-delivery-date" className="form-label">Delivery Date *</label>
              <input id="query-delivery-date" type="date" required className="form-input" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
            </div>
          </div>
        </section>

        <section className="app-surface p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="section-title">Plate requirements</h3>
            <p className="mt-1 text-sm text-slate-500">Add the overall cover requirements for this query.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="query-with-cover" className="form-label">With Cover</label><input id="query-with-cover" type="number" min="0" className="form-input" value={withCover || ''} onChange={(event) => setWithCover(Number(event.target.value || 0))} placeholder="0" /></div>
            <div><label htmlFor="query-without-cover" className="form-label">Without Cover</label><input id="query-without-cover" type="number" min="0" className="form-input" value={withoutCover || ''} onChange={(event) => setWithoutCover(Number(event.target.value || 0))} placeholder="0" /></div>
          </div>
        </section>

        <section className="app-surface p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="section-title">Products</h3>
              <p className="mt-1 text-sm text-slate-500">Choose a product or enter its details. Line totals update automatically.</p>
            </div>
            <button type="button" className="primary-btn" disabled={products.length >= 8} onClick={() => setProducts((current) => [...current, { id: '', name: '', quantity: 0, purchaseCost: 0, selling: 0 }])}>+ Add Product</button>
          </div>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={`${product.id}-${index}`} className="rounded-2xl border border-[#e3efec] bg-[#f9fffd] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Product {index + 1}</h4>
                  {products.length > 1 && <button type="button" className="muted-btn text-red-600" onClick={() => setProducts((current) => current.filter((_, productIndex) => productIndex !== index))}>Remove</button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <label className="form-label">Product ID</label>
                    <select className="form-input" value={product.id} onChange={(event) => {
                      const item = inventoryOptions.find((option) => option.productId === event.target.value)
                      updateProduct(index, item
                        ? { id: item.productId, name: item.productName, purchaseCost: item.costPerSheet, selling: item.sellingCost }
                        : { id: event.target.value })
                    }}>
                      <option value="">Choose product</option>
                      {inventoryOptions.map((item) => <option key={item.productId || item.id} value={item.productId}>{item.productId || item.productName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Product Name</label>
                    <input className="form-input" value={product.name} onChange={(event) => updateProduct(index, { name: event.target.value })} placeholder="Product name" />
                  </div>
                  <div>
                    <label className="form-label">Quantity / Plates</label>
                    <input type="number" min="0" className="form-input" value={product.quantity || ''} onChange={(event) => updateProduct(index, { quantity: Number(event.target.value || 0) })} placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Purchase Cost / Plate</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={product.purchaseCost || ''} onChange={(event) => updateProduct(index, { purchaseCost: Number(event.target.value || 0) })} placeholder="₹0" />
                  </div>
                  <div>
                    <label className="form-label">Selling Price / Plate</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={product.selling || ''} onChange={(event) => updateProduct(index, { selling: Number(event.target.value || 0) })} placeholder="₹0" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
                  Line total: <strong className="ml-2 text-slate-800">{formatCurrency(product.quantity * product.selling)}</strong>
                </div>
              </div>
            ))}
          </div>
          {products.length >= 8 && <p className="mt-3 text-sm font-medium text-slate-500">Maximum 8 products per query.</p>}
        </section>

        <section className="app-surface p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="section-title">Order status &amp; payment</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><label htmlFor="query-stage" className="form-label">Order Stage</label><select id="query-stage" className="form-input" value={stage} onChange={(event) => setStage(event.target.value as OrderQuery['stage'])}>{stages.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label htmlFor="query-payment" className="form-label">Payment Method</label><select id="query-payment" className="form-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as OrderQuery['paymentMethod'])}><option>Cash</option><option>Online</option></select></div>
            <div><label htmlFor="query-advance" className="form-label">Advance Payment</label><input id="query-advance" type="number" min="0" step="0.01" className="form-input" value={advancePayment || ''} onChange={(event) => setAdvancePayment(Number(event.target.value || 0))} placeholder="₹0" /></div>
          </div>
        </section>

        <section className="rounded-[20px] border border-[#e7f1ef] bg-[#f6fffc] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Plates</div><div className="mt-2 text-xl font-semibold text-slate-800">{totals.totalPlates.toLocaleString('en-IN')}</div></div>
            <div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Grand Total</div><div className="mt-2 text-xl font-semibold text-slate-800">{formatCurrency(totals.grandTotal)}</div></div>
            <div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Remaining</div><div className="mt-2 text-xl font-semibold text-slate-800">{formatCurrency(totals.remaining)}</div></div>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-24 z-[60] border-t border-[#dce8e3] bg-white/95 p-3 shadow-[0_-12px_30px_rgba(18,63,56,0.12)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="secondary-btn" onClick={() => navigate('/orders')}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving || isLoading || !customerName.trim() || !mobile.trim() || !deliveryDate}>
              {saving ? 'Saving query…' : editingId ? 'Update Query' : stage === 'Delivered' ? 'Save Query & Create Sale' : 'Save Customer Query'}
            </button>
          </div>
        </div>
      </form>

      <section className="app-surface overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div><h3 className="section-title">Saved Customer Queries</h3><p className="mt-1 text-sm text-slate-500">Review, edit, and download customer order details.</p></div>
          <span className="filter-chip">{orders.length} {orders.length === 1 ? 'query' : 'queries'}</span>
        </div>
        {orders.length === 0 ? <div className="empty-panel">No customer queries yet</div> : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-[#e7f1ef] bg-[#f9fffd] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-slate-800">{order.customerName}</strong>
                  <div className="mt-1 text-sm text-slate-600">{order.mobile} · {order.totalPlates} plates · Delivery {order.deliveryDate}</div>
                  <div className="mt-1 text-xs text-slate-500">Query {order.id} · {formatCurrency(order.grandTotal)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="filter-chip">{order.stage === 'Delivered' ? 'Delivered / Completed' : order.stage}</span>
                  {order.stage !== 'Cancelled' && order.stage !== 'Delivered' && !order.saleId && (
                    <>
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={Boolean(updatingOrderId)}
                        onClick={() => void updateOrderStage(order, 'Delivered')}
                      >
                        {updatingOrderId === order.id ? 'Updating…' : 'Mark Delivered / Complete'}
                      </button>
                      <button
                        type="button"
                        className="muted-btn text-red-600"
                        disabled={Boolean(updatingOrderId)}
                        onClick={() => void updateOrderStage(order, 'Cancelled')}
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                  {order.stage === 'Delivered' && !order.saleId && (
                    <button type="button" className="primary-btn" disabled={Boolean(updatingOrderId)} onClick={() => void updateOrderStage(order, 'Delivered')}>
                      {updatingOrderId === order.id ? 'Completing…' : 'Create Sale Record'}
                    </button>
                  )}
                  {failedSaleRecordIds.includes(order.id) && order.stage === 'Delivered' && order.saleId && (
                    <button
                      type="button"
                      className="muted-btn"
                      disabled={Boolean(updatingOrderId)}
                      onClick={() => void updateOrderStage(order, 'Delivered')}
                    >
                      {updatingOrderId === order.id ? 'Completing…' : 'Retry Sale Record'}
                    </button>
                  )}
                  <button className="muted-btn" type="button" onClick={() => void downloadQueryImage(order)} disabled={Boolean(downloadingImageId)}>{downloadingImageId === order.id ? 'Creating image…' : 'Download PNG'}</button>
                  <Link className="muted-btn" to={`/orders?id=${order.id}`}>Edit</Link>
                  {order.saleId && <Link className="muted-btn" to={`/sales?search=${encodeURIComponent(order.saleId)}`}>Sale Invoice</Link>}
                  <button type="button" className="muted-btn text-red-600" onClick={() => void remove(order.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
