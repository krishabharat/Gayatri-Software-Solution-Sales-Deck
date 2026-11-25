import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState/EmptyState'
import { describeCloudError, getCloudInventoryItems, getCloudProductMasterItems, getCloudSalesRecords, getCloudStockSalesRecords, saveCloudProductMasterItem, saveCloudStockIntakes, updateCloudProductMasterItem, updateCloudStockIntake } from '../utils/cloudStorage'
import { formatCurrency, type InventoryItem, type ProductMasterItem, type SaleRecord } from '../utils/storage'
import { getInventoryProductKey, getInventoryProducts } from '../utils/inventoryPricing'
import { downloadInventoryStockHistoryWorkbook } from '../utils/businessExport'
import { downloadInventoryStockHistoryPdf } from '../utils/inventoryHistoryPdf'

type IntakeForm = {
  date: string
  supplier: string
  quantity: string
  costPerSheet: string
  sellingPrice: string
  transportCost: string
  type: string
  notes: string
}

const unitOptions = ['Sheet', 'Piece', 'Bowl', 'Box', 'Kg', 'Gram', 'Litre', 'Millilitre', 'Metre', 'Pack', 'Set', 'Roll', 'Dozen', 'Other']
const wholeNumberUnits = new Set(['sheet', 'piece', 'bowl', 'box', 'pack', 'set', 'roll', 'dozen'])

const emptyForm = {
  productId: '',
  productName: '',
  category: '',
  unit: '',
  defaultCost: '',
  defaultSellingPrice: '',
  minimumStockLevel: ''
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyIntakeForm(): IntakeForm {
  return {
    date: getLocalDateInputValue(),
    supplier: '',
    quantity: '',
    costPerSheet: '',
    sellingPrice: '',
    transportCost: '0',
    type: 'Purchased',
    notes: ''
  }
}

export default function ProductMaster() {
  const [searchParams] = useSearchParams()
  const requestedProductId = searchParams.get('productId') || ''
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [productMasters, setProductMasters] = useState<ProductMasterItem[]>([])
  const [allSales, setAllSales] = useState<SaleRecord[]>([])
  const [stockTrackedSales, setStockTrackedSales] = useState<SaleRecord[]>([])
  const [search, setSearch] = useState('')
  const [selectedSalesDate, setSelectedSalesDate] = useState(() => getLocalDateInputValue())
  const [stockEntryProductKey, setStockEntryProductKey] = useState(() => getInventoryProductKey(requestedProductId))
  const [editingStockReceiptId, setEditingStockReceiptId] = useState('')
  const [intakeForm, setIntakeForm] = useState<IntakeForm>(createEmptyIntakeForm)
  const [showForm, setShowForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [exportingInventoryFormat, setExportingInventoryFormat] = useState<'pdf' | 'excel' | ''>('')
  const [expandedProductKey, setExpandedProductKey] = useState(() => getInventoryProductKey(requestedProductId))
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    Promise.all([getCloudInventoryItems(), getCloudProductMasterItems(), getCloudSalesRecords(), getCloudStockSalesRecords()])
      .then(([loadedInventory, loadedProducts, loadedSales, loadedStockTrackedSales]) => {
        setInventory(loadedInventory)
        setProductMasters(loadedProducts)
        setAllSales(loadedSales)
        setStockTrackedSales(loadedStockTrackedSales)
      })
      .catch((loadError) => setError(describeCloudError(loadError, 'Unable to load products and stock history.')))
      .finally(() => setIsLoading(false))
  }, [])

  const products = useMemo(
    () => getInventoryProducts(inventory, productMasters, allSales, stockTrackedSales),
    [inventory, productMasters, allSales, stockTrackedSales]
  )
  const visibleProducts = useMemo(() => products.filter((product) =>
    `${product.productId} ${product.productName} ${product.category}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [products, search])
  const hasDuplicateProduct = products.some((product) => product.id !== editingProductId && (
    (form.productId.trim() && product.productId.trim().toLocaleLowerCase() === form.productId.trim().toLocaleLowerCase()) ||
    (form.productName.trim() && product.productName.trim().toLocaleLowerCase() === form.productName.trim().toLocaleLowerCase())
  ))
  const selectedUnitOption = unitOptions.includes(form.unit) ? form.unit : form.unit ? 'Other' : ''
  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const openStockEntry = (product: ProductMasterItem) => {
    const key = getInventoryProductKey(product.productId, product.productName)
    const latestIntake = products.find((item) => getInventoryProductKey(item.productId, item.productName) === key)
    setError('')
    setEditingStockReceiptId('')
    setExpandedProductKey(key)
    setStockEntryProductKey(key)
    setIntakeForm({
      ...createEmptyIntakeForm(),
      costPerSheet: String(latestIntake?.latestCost ?? product.defaultCost ?? ''),
      sellingPrice: String(product.defaultSellingPrice || '')
    })
  }

  const openReceiptForEdit = (product: ProductMasterItem, receipt: InventoryItem) => {
    const key = getInventoryProductKey(product.productId, product.productName)
    setError('')
    setExpandedProductKey(key)
    setStockEntryProductKey(key)
    setEditingStockReceiptId(receipt.id)
    setIntakeForm({
      date: receipt.date,
      supplier: receipt.supplierName || '',
      quantity: String(receipt.quantity),
      costPerSheet: String(receipt.costPerSheet),
      sellingPrice: String(receipt.sellingCost),
      transportCost: String(receipt.transportCost),
      type: receipt.type,
      notes: receipt.notes || ''
    })
  }

  const handleIntakeChange = (field: keyof IntakeForm, value: string) => {
    setIntakeForm((current) => ({ ...current, [field]: value }))
  }

  const saveStockEntry = async (product: ProductMasterItem) => {
    const quantity = Number(intakeForm.quantity)
    const costPerSheet = Number(intakeForm.costPerSheet)
    const sellingCost = Number(intakeForm.sellingPrice || 0)
    const transportCost = Number(intakeForm.transportCost || 0)
    if (!intakeForm.date || !Number.isFinite(quantity) || quantity <= 0 ||
      (wholeNumberUnits.has(product.unit.toLocaleLowerCase()) && !Number.isInteger(quantity)) ||
      intakeForm.costPerSheet === '' || !Number.isFinite(costPerSheet) || costPerSheet < 0 ||
      !Number.isFinite(sellingCost) || sellingCost < 0 ||
      !Number.isFinite(transportCost) || transportCost < 0) {
      setError(`Enter a date, a valid quantity${wholeNumberUnits.has(product.unit.toLocaleLowerCase()) ? ' as a whole number' : ''}, and valid non-negative prices.`)
      return
    }

    setIsSaving(true)
    setError('')
    const existingReceipt = inventory.find((item) => item.id === editingStockReceiptId)
    const createdAt = existingReceipt?.createdAt || new Date().toISOString()
    const materialCost = quantity * costPerSheet
    const intake: InventoryItem = {
      id: existingReceipt?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      date: intakeForm.date,
      productId: product.productId,
      productName: product.productName,
      supplierName: intakeForm.supplier.trim(),
      quantity,
      costPerSheet,
      sellingCost,
      transportCost,
      type: intakeForm.type,
      materialCost,
      totalCost: materialCost + transportCost,
      notes: intakeForm.notes.trim(),
      intakeBatchId: existingReceipt?.intakeBatchId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt
    }
    try {
      if (existingReceipt) {
        await updateCloudStockIntake(intake)
        setInventory((current) => current.map((item) => item.id === intake.id ? intake : item))
      } else {
        await saveCloudStockIntakes([intake])
        setInventory((current) => [intake, ...current])
      }
      setStockEntryProductKey('')
      setEditingStockReceiptId('')
      setIntakeForm(createEmptyIntakeForm())
    } catch (saveError) {
      setError(describeCloudError(saveError, 'Unable to save this stock receipt.'))
    } finally {
      setIsSaving(false)
    }
  }

  const downloadCompleteInventoryHistory = (format: 'pdf' | 'excel') => {
    setExportingInventoryFormat(format)
    setError('')
    try {
      if (format === 'pdf') downloadInventoryStockHistoryPdf(inventory, products)
      else downloadInventoryStockHistoryWorkbook(inventory, products)
    } catch (exportError) {
      setError(describeCloudError(exportError, 'Unable to download complete inventory history.'))
    } finally {
      setExportingInventoryFormat('')
    }
  }

  const openProductEditor = (product: ProductMasterItem) => {
    setError('')
    setEditingProductId(product.id)
    setForm({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      unit: product.unit,
      defaultCost: String(product.defaultCost),
      defaultSellingPrice: String(product.defaultSellingPrice),
      minimumStockLevel: String(product.minimumStockLevel)
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeProductEditor = () => {
    setShowForm(false)
    setEditingProductId('')
    setForm(emptyForm)
  }

  const openNewProductForm = () => {
    setError('')
    setEditingProductId('')
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleSave = async () => {
    const productId = form.productId.trim()
    const productName = form.productName.trim()
    if (!productId || !productName || !form.unit.trim() || form.unit === 'Other') {
      setError('Enter a product ID, product name, and a unit of measure.')
      return
    }
    const numericDefaults = [form.defaultCost, form.defaultSellingPrice, form.minimumStockLevel]
    if (numericDefaults.some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      setError('Default prices and minimum stock must be zero or greater.')
      return
    }

    if (products.some((product) => product.id !== editingProductId && (
      product.productId.trim().toLocaleLowerCase() === productId.toLocaleLowerCase() ||
      product.productName.trim().toLocaleLowerCase() === productName.toLocaleLowerCase()
    ))) {
      setError('This product already exists. Select it and add a stock intake instead.')
      return
    }

    setError('')
    setIsSaving(true)
    const existingProduct = products.find((product) => product.id === editingProductId)
    const nextProduct: ProductMasterItem = {
      id: existingProduct?.id || `${Date.now()}-product`,
      productId,
      productName,
      category: form.category.trim() || 'General',
      unit: form.unit.trim(),
      defaultCost: Number(form.defaultCost || 0),
      defaultSellingPrice: Number(form.defaultSellingPrice || 0),
      minimumStockLevel: Number(form.minimumStockLevel || 0),
      createdAt: existingProduct?.createdAt || new Date().toISOString()
    }

    try {
      if (existingProduct) {
        await updateCloudProductMasterItem(nextProduct)
        setProductMasters((current) => current.map((product) => product.id === nextProduct.id ? nextProduct : product))
        setInventory((current) => current.map((intake) => intake.productId === existingProduct.productId ? {
          ...intake,
          productId: nextProduct.productId,
          productName: nextProduct.productName
        } : intake))
      } else {
        await saveCloudProductMasterItem(nextProduct)
        setProductMasters((current) => [nextProduct, ...current])
      }
      closeProductEditor()
    } catch (saveError) {
      setError(describeCloudError(saveError, 'Unable to save product.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Inventory · Product Master</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">Product Stock Register</h2>
          <p className="mt-1 text-sm text-slate-500">Create each product once. Open its stock entry to record every delivery and preserve its price history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadCompleteInventoryHistory('pdf')}
            disabled={isLoading || inventory.length === 0 || Boolean(exportingInventoryFormat)}
            className="secondary-btn"
          >
            {exportingInventoryFormat === 'pdf' ? 'Preparing PDF…' : 'Download All Inventory PDF'}
          </button>
          <button
            type="button"
            onClick={() => downloadCompleteInventoryHistory('excel')}
            disabled={isLoading || inventory.length === 0 || Boolean(exportingInventoryFormat)}
            className="secondary-btn"
          >
            {exportingInventoryFormat === 'excel' ? 'Preparing Excel…' : 'Download All Inventory Excel'}
          </button>
          <button type="button" onClick={() => showForm ? closeProductEditor() : openNewProductForm()} className="primary-btn">
            {showForm ? 'Close Form' : '+ Create Product'}
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Inventory summary">
        {[
          ['Products', products.length.toLocaleString('en-IN')],
          ['Products in stock', products.filter((product) => product.stockOnHand > 0).length.toLocaleString('en-IN')],
          ['Stock receipt batches', new Set(inventory.map((intake) => intake.intakeBatchId || intake.id)).size.toLocaleString('en-IN')]
        ].map(([label, value]) => (
          <div key={label} className="app-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">{isLoading ? '—' : value}</div>
          </div>
        ))}
      </section>

      {showForm && (
        <div className="app-surface p-4 sm:p-6">
          <h3 className="section-title mb-1">{editingProductId ? 'Edit product details' : 'Create a product once'}</h3>
          <p className="mb-4 text-sm text-slate-500">Choose the unit that matches how this product is purchased and stocked. Prices are recorded per selected unit.</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="form-label">Product ID *</label>
              <input value={form.productId} onChange={(event) => handleChange('productId', event.target.value)} className="form-input" placeholder="Product ID" readOnly={Boolean(editingProductId)} />
              {editingProductId && <p className="mt-1 text-xs text-slate-500">Product ID is kept fixed so existing sales and stock records remain linked.</p>}
            </div>
            <div>
              <label className="form-label">Product Name *</label>
              <input value={form.productName} onChange={(event) => handleChange('productName', event.target.value)} className="form-input" placeholder="Product Name" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input value={form.category} onChange={(event) => handleChange('category', event.target.value)} className="form-input" placeholder="Category" />
            </div>
            <div>
              <label className="form-label">Unit of Measure *</label>
              <select
                value={selectedUnitOption}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  unit: event.target.value === 'Other'
                    ? (current.unit && !unitOptions.includes(current.unit) ? current.unit : 'Other')
                    : event.target.value
                }))}
                className="form-input"
              >
                <option value="">Choose the stock unit</option>
                {unitOptions.map((unit) => <option key={unit} value={unit}>{unit === 'Other' ? 'Other (custom unit)' : unit}</option>)}
              </select>
              {selectedUnitOption === 'Other' && (
                <input
                  value={unitOptions.includes(form.unit) ? '' : form.unit}
                  onChange={(event) => handleChange('unit', event.target.value)}
                  className="form-input mt-2"
                  placeholder="Enter unit (e.g. Bundle)"
                  aria-label="Custom unit of measure"
                />
              )}
              {editingProductId && products.find((product) => product.id === editingProductId)?.unit !== form.unit && (
                <p role="note" className="mt-1 text-xs font-medium text-amber-800">Changing this unit relabels the meaning of existing stock quantities; it does not convert them.</p>
              )}
            </div>
            <div>
              <label className="form-label">Default Purchase Cost / {form.unit && form.unit !== 'Other' ? form.unit : 'unit'}</label>
              <input type="number" min={0} step="0.01" value={form.defaultCost} onChange={(event) => handleChange('defaultCost', event.target.value)} className="form-input" placeholder="₹0" />
            </div>
            <div>
              <label className="form-label">Default Selling Price / {form.unit && form.unit !== 'Other' ? form.unit : 'unit'}</label>
              <input type="number" min={0} step="0.01" value={form.defaultSellingPrice} onChange={(event) => handleChange('defaultSellingPrice', event.target.value)} className="form-input" placeholder="₹0" />
            </div>
            <div>
              <label className="form-label">Minimum Stock Level</label>
              <input type="number" min={0} value={form.minimumStockLevel} onChange={(event) => handleChange('minimumStockLevel', event.target.value)} className="form-input" placeholder="0" />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            {hasDuplicateProduct && <p role="alert" className="mr-auto self-center text-sm font-semibold text-amber-900">A product with this ID or name already exists.</p>}
            <button type="button" onClick={closeProductEditor} className="secondary-btn">Cancel</button>
            <button type="button" onClick={() => void handleSave()} disabled={isSaving || hasDuplicateProduct} className="primary-btn">{isSaving ? 'Saving...' : editingProductId ? 'Save Changes' : 'Save Product'}</button>
          </div>
        </div>
      )}

      <section className="app-surface p-5 sm:p-6">
        {products.length > 0 && <div className="mb-5 max-w-xl">
          <label htmlFor="product-search" className="form-label">Search product master</label>
          <input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} className="form-input" placeholder="Product ID, name or category" />
        </div>}
        {isLoading ? (
          <div role="status" className="py-10 text-center text-sm text-slate-500">Loading product and stock history…</div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products added yet"
            description="Create each product once, then receive stock and review its full history here."
            cta={<button type="button" onClick={openNewProductForm} className="primary-btn">+ Create Product</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Available Stock</th>
                  <th className="py-3 pr-4">Latest Purchase Cost</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const productKey = getInventoryProductKey(product.productId, product.productName)
                  const intakeHistory = product.inventoryRecords
                  const isExpanded = expandedProductKey === productKey
                  const restocksAllTime = new Set(intakeHistory.map((intake) => intake.intakeBatchId || intake.id)).size
                  const salesOnSelectedDate = product.salesRecords.filter((sale) => sale.saleDate === selectedSalesDate)
                  const quantitySoldOnSelectedDate = salesOnSelectedDate.reduce((sum, sale) => sum + sale.quantity, 0)
                  return (
                    <Fragment key={productKey}>
                      <tr className="border-b border-[#edf3f2] align-top">
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-slate-800">{product.productName}</div>
                            <div className="text-xs text-slate-500">{product.productId} · {product.category}</div>
                          </td>
                          <td className="py-3 pr-4 font-semibold">{product.stockOnHand.toLocaleString('en-IN')} {product.unit}{product.stockOnHand <= product.minimumStockLevel && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Low stock</span>}</td>
                          <td className="py-3 pr-4">{product.latestCost === null ? '—' : `${formatCurrency(product.latestCost)} / ${product.unit}`}</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openStockEntry(product)} className="primary-btn">+ Add Stock</button>
                              <button type="button" onClick={() => openProductEditor(product)} className="muted-btn">Edit Product</button>
                              <button type="button" onClick={() => setExpandedProductKey(isExpanded ? '' : productKey)} className="muted-btn">
                                {isExpanded ? 'Hide Details' : `History (${intakeHistory.length})`}
                              </button>
                            </div>
                          </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-[#edf3f2]">
                          <td colSpan={4} className="space-y-4 bg-[#fbfefc] p-4">
                            {stockEntryProductKey === productKey && (
                              <form
                                className="rounded-2xl border border-[#cfe4dc] bg-white p-4 sm:p-5"
                                onSubmit={(event) => { event.preventDefault(); void saveStockEntry(product) }}
                              >
                                <div className="mb-4">
                                  <h4 className="section-title">{editingStockReceiptId ? 'Edit stock receipt' : 'Record stock received'}</h4>
                                  <p className="mt-1 text-sm text-slate-500">{product.productId} · {product.productName}. Enter quantities and prices per {product.unit}.</p>
                                  {editingStockReceiptId && <p role="note" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Saving changes updates this receipt. Its previous values are retained in the inventory audit log.</p>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                  <div>
                                    <label className="form-label">Received Date *</label>
                                    <input type="date" required className="form-input" value={intakeForm.date} onChange={(event) => handleIntakeChange('date', event.target.value)} />
                                  </div>
                                  <div>
                                    <label className="form-label">Quantity Received ({product.unit}) *</label>
                                    <input type="number" min="1" step={wholeNumberUnits.has(product.unit.toLocaleLowerCase()) ? '1' : 'any'} required className="form-input" value={intakeForm.quantity} onChange={(event) => handleIntakeChange('quantity', event.target.value)} placeholder={`Enter ${wholeNumberUnits.has(product.unit.toLocaleLowerCase()) ? 'whole-number quantity' : 'quantity'}`} />
                                  </div>
                                  <div>
                                    <label className="form-label">Purchase Cost per {product.unit} *</label>
                                    <input type="number" min="0" step="0.01" required className="form-input" value={intakeForm.costPerSheet} onChange={(event) => handleIntakeChange('costPerSheet', event.target.value)} placeholder="Enter purchase cost" />
                                    {product.latestCost !== null && <p className="mt-1 text-xs text-slate-500">Last recorded: {formatCurrency(product.latestCost)} / {product.unit}</p>}
                                  </div>
                                  <div>
                                    <label className="form-label">Selling price per {product.unit}</label>
                                    <input type="number" min="0" step="0.01" className="form-input" value={intakeForm.sellingPrice} onChange={(event) => handleIntakeChange('sellingPrice', event.target.value)} placeholder="Optional" />
                                  </div>
                                  <div>
                                    <label className="form-label">Supplier</label>
                                    <input className="form-input" value={intakeForm.supplier} onChange={(event) => handleIntakeChange('supplier', event.target.value)} placeholder="Supplier name" />
                                  </div>
                                  <div>
                                    <label className="form-label">Transport Cost</label>
                                    <input type="number" min="0" step="0.01" className="form-input" value={intakeForm.transportCost} onChange={(event) => handleIntakeChange('transportCost', event.target.value)} placeholder="0" />
                                  </div>
                                  <div>
                                    <label className="form-label">Receipt Type</label>
                                    <select className="form-input" value={intakeForm.type} onChange={(event) => handleIntakeChange('type', event.target.value)}>
                                      <option value="Purchased">Purchased</option>
                                      <option value="Stock">Stock</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="form-label">Invoice / Notes</label>
                                    <input className="form-input" value={intakeForm.notes} onChange={(event) => handleIntakeChange('notes', event.target.value)} placeholder="Optional reference" />
                                  </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#f3faf7] p-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="text-sm text-slate-600">
                                    Material cost <strong>{formatCurrency((Number(intakeForm.quantity) || 0) * (Number(intakeForm.costPerSheet) || 0))}</strong>
                                    <span className="mx-2">·</span>
                                    Total with transport <strong>{formatCurrency((Number(intakeForm.quantity) || 0) * (Number(intakeForm.costPerSheet) || 0) + (Number(intakeForm.transportCost) || 0))}</strong>
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="button" className="secondary-btn" onClick={() => { setStockEntryProductKey(''); setEditingStockReceiptId(''); setIntakeForm(createEmptyIntakeForm()) }}>Cancel</button>
                                    <button type="submit" className="primary-btn" disabled={isSaving}>{isSaving ? 'Saving receipt…' : editingStockReceiptId ? 'Save Receipt Changes' : 'Save Stock Receipt'}</button>
                                  </div>
                                </div>
                              </form>
                            )}
                            <div className="flex flex-col gap-3 rounded-xl border border-[#dcece7] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <div className="form-label">Units sold on selected date</div>
                                <div className="mt-1 text-2xl font-semibold text-slate-800">{quantitySoldOnSelectedDate.toLocaleString('en-IN')} <span className="text-sm font-medium text-slate-500">{product.unit}</span></div>
                                <div className="mt-1 text-xs text-slate-500">{salesOnSelectedDate.length} sale{salesOnSelectedDate.length === 1 ? '' : 's'} recorded for this product</div>
                              </div>
                              <div className="w-full sm:max-w-56">
                                <label htmlFor={`sales-date-${productKey}`} className="form-label">Sales date</label>
                                <input
                                  id={`sales-date-${productKey}`}
                                  type="date"
                                  value={selectedSalesDate}
                                  onChange={(event) => setSelectedSalesDate(event.target.value)}
                                  className="form-input"
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {[
                                ['Current Stock', `${product.stockOnHand.toLocaleString('en-IN')} ${product.unit}`],
                                ['Restocks All Time', String(restocksAllTime)],
                                ['Average Purchase Cost', product.averageCost === null ? '—' : `${formatCurrency(product.averageCost)} / ${product.unit}`],
                                ['Latest Purchase Cost', product.latestCost === null ? '—' : `${formatCurrency(product.latestCost)} / ${product.unit}`],
                              ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#e7f1ef] bg-white p-3"><div className="form-label">{label}</div><div className="mt-1 font-semibold text-slate-800">{value}</div></div>)}
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-[#e7f1ef] bg-white">
                              <div className="flex flex-col gap-3 border-b border-[#e6f0ee] p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="font-semibold text-slate-800">Stock receipt history</h4>
                                  <p className="mt-1 text-xs text-slate-500">Every delivery and its recorded purchase price. Use the complete inventory downloads above for all products.</p>
                                </div>
                              </div>
                              {intakeHistory.length === 0 ? (
                                <p className="p-4 text-sm text-slate-500">No stock receipts yet. Use “Add Stock” above to record the first delivery.</p>
                              ) : (
                                <table className="min-w-full text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-[#e6f0ee] text-slate-600">
                                      <th className="px-4 py-3">Received Date</th>
                                      <th className="px-4 py-3">Supplier</th>
                                      <th className="px-4 py-3">Qty Received ({product.unit})</th>
                                      <th className="px-4 py-3">Purchase Cost / Unit</th>
                                      <th className="px-4 py-3">Selling Price / Unit</th>
                                      <th className="px-4 py-3">Total Cost</th>
                                      <th className="px-4 py-3">Type</th>
                                      <th className="px-4 py-3">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {intakeHistory.map((intake) => (
                                      <tr key={intake.id} className="border-b border-[#edf3f2] last:border-0">
                                        <td className="whitespace-nowrap px-4 py-3">{intake.date}</td>
                                        <td className="px-4 py-3">{intake.supplierName || '—'}</td>
                                        <td className="px-4 py-3">{Number(intake.quantity || 0).toLocaleString('en-IN')} {product.unit}</td>
                                        <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatCurrency(Number(intake.costPerSheet || 0))}</td>
                                        <td className="whitespace-nowrap px-4 py-3">{formatCurrency(Number(intake.sellingCost || 0))}</td>
                                        <td className="whitespace-nowrap px-4 py-3">{formatCurrency(Number(intake.totalCost || 0))}</td>
                                        <td className="px-4 py-3">{intake.type}</td>
                                        <td className="px-4 py-3">
                                          <button type="button" className="muted-btn" onClick={() => openReceiptForEdit(product, intake)}>Edit Receipt</button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {products.length > 0 && visibleProducts.length === 0 && <div className="empty-panel">No products match this search.</div>}
    </div>
  )
}
