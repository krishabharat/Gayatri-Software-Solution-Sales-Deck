import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState/EmptyState'
import { formatCurrency, type SaleRecord } from '../utils/storage'
import { deleteCloudSale, describeCloudError, getCloudSalesRecords, migrateLegacySaleIds } from '../utils/cloudStorage'

const filters = ['Search', 'Date', 'Payment']

export default function Sales() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMigratingIds, setIsMigratingIds] = useState(false)
  const [searchParams] = useSearchParams()
  const search = (searchParams.get('search') || '').trim().toLowerCase()

  useEffect(() => {
    getCloudSalesRecords()
      .then(setSales)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load sales.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (saleId: string) => {
    try {
      setError('')
      await deleteCloudSale(saleId)
      setSales((currentSales) => currentSales.filter((sale) => sale.id !== saleId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete sale.')
    }
  }

  const openInvoice = (sale: SaleRecord) => setSelectedSale(sale)

  const closeInvoice = () => setSelectedSale(null)

  const handleEdit = (saleId: string) => {
    navigate(`/sales/new?id=${saleId}`)
  }

  const handleMigrateIds = async () => {
    if (isMigratingIds) return
    setIsMigratingIds(true)
    setError('')
    try {
      const migratedCount = await migrateLegacySaleIds()
      const refreshedSales = await getCloudSalesRecords()
      setSales(refreshedSales)
      setError(migratedCount > 0 ? `Updated ${migratedCount} old sale ID${migratedCount === 1 ? '' : 's'} to the new format.` : 'All sale IDs already use the new format.')
    } catch (migrationError) {
      setError(describeCloudError(migrationError, 'Unable to update old sale IDs.'))
    } finally {
      setIsMigratingIds(false)
    }
  }

  const filteredSales = useMemo(() => {
    if (!search) return sales
    return sales.filter((sale) => [
      sale.id,
      sale.customerName,
      sale.mobile,
      ...sale.products.flatMap((product) => [product.id, product.name])
    ].some((value) => value.toLowerCase().includes(search)))
  }, [sales, search])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Sales management</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-800">Sales</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void handleMigrateIds()} disabled={isMigratingIds} className="secondary-btn w-full sm:w-auto">
            {isMigratingIds ? 'UPDATING IDS...' : 'UPDATE OLD IDS'}
          </button>
          <Link to="/sales/new" className="primary-btn w-full sm:w-auto">+ New Sale</Link>
        </div>
      </header>

      <div className="app-surface p-4 sm:p-6">
        {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e8f1ee] bg-[#f7fffc] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter} className="filter-chip" type="button">{filter}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="muted-btn" type="button">Date filter</button>
            <button className="muted-btn" type="button">Payment filter</button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-panel" role="status" aria-live="polite">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#dcefe9] border-t-[#0f6b63]" />
            <div className="text-base font-medium text-slate-700">Loading sales...</div>
            <div className="mt-1 text-sm text-slate-500">Getting the latest records from the cloud.</div>
          </div>
        ) : filteredSales.length === 0 ? (
          <EmptyState
            title={search ? 'No matching sales found' : 'No sales recorded yet'}
            description={search ? 'Try a customer name, mobile number, invoice ID, or product name.' : 'Create your first sale to start tracking your business performance.'}
            cta={<Link to="/sales/new" className="primary-btn">+ New Sale</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e6f0ee] text-slate-600">
                  <th className="py-3 pr-4">Sale ID</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Mobile</th>
                  <th className="py-3 pr-4">Products</th>
                  <th className="py-3 pr-4">Total Plates</th>
                  <th className="py-3 pr-4">Total Amount</th>
                  <th className="py-3 pr-4">Cost / Plate</th>
                  <th className="py-3 pr-4">Sell / Plate</th>
                  <th className="py-3 pr-4">Profit</th>
                  <th className="py-3 pr-4">Payment Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-[#edf3f2] align-top">
                    {(() => {
                      const makingCost = sale.products.reduce((sum, product) => sum + product.quantity * product.purchaseCost, 0)
                      const sellingTotal = sale.products.reduce((sum, product) => sum + product.quantity * product.selling, 0)
                      const costPerPlate = sale.totalPlates > 0 ? makingCost / sale.totalPlates : 0
                      const sellingPerPlate = sale.totalPlates > 0 ? sellingTotal / sale.totalPlates : 0
                      return <>
                    <td className="py-3 pr-4 font-medium">{sale.id}</td>
                    <td className="py-3 pr-4">{sale.saleDate}</td>
                    <td className="py-3 pr-4">{sale.customerName}</td>
                    <td className="py-3 pr-4">{sale.mobile}</td>
                    <td className="py-3 pr-4">{sale.products.length}</td>
                    <td className="py-3 pr-4">{sale.totalPlates}</td>
                    <td className="py-3 pr-4">{formatCurrency(sale.grandTotal)}</td>
                    <td className="py-3 pr-4">{formatCurrency(costPerPlate)}</td>
                    <td className="py-3 pr-4">{formatCurrency(sellingPerPlate)}</td>
                    <td className={`py-3 pr-4 font-semibold ${sale.grandTotal - makingCost >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(sale.grandTotal - makingCost)}</td>
                    <td className="py-3 pr-4">{sale.paymentStatus}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="muted-btn" type="button" onClick={() => openInvoice(sale)}>View</button>
                        <button className="muted-btn" type="button" onClick={() => handleEdit(sale.id)}>Edit</button>
                        <button className="muted-btn" type="button" onClick={() => handleDelete(sale.id)}>Delete</button>
                        <button className="muted-btn" type="button" onClick={() => openInvoice(sale)}>Print Invoice</button>
                      </div>
                    </td>
                      </>
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="invoice-print-area w-full max-w-4xl rounded-[26px] border border-[#e7f1ef] bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.16)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#edf3f1] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8d89]">Invoice</div>
                <div className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-900">SAI GAYATRI</div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Industries</div>
              </div>
              <div className="text-left text-sm text-slate-600 sm:text-right">
                <div><span className="font-semibold text-slate-800">Invoice #</span> {selectedSale.id}</div>
                <div><span className="font-semibold text-slate-800">Date:</span> {selectedSale.saleDate}</div>
                <div><span className="font-semibold text-slate-800">Status:</span> {selectedSale.paymentStatus}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e9f1ef] bg-[#f8fffc] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Bill To</div>
                <div className="mt-3 text-lg font-semibold text-slate-900">{selectedSale.customerName}</div>
                <div className="mt-1 text-sm text-slate-600">{selectedSale.mobile}</div>
              </div>

              {(() => {
                const makingCost = selectedSale.products.reduce((sum, product) => sum + product.quantity * product.purchaseCost, 0)
                const sellingTotal = selectedSale.products.reduce((sum, product) => sum + product.quantity * product.selling, 0)
                const costPerPlate = selectedSale.totalPlates > 0 ? makingCost / selectedSale.totalPlates : 0
                const sellingPerPlate = selectedSale.totalPlates > 0 ? sellingTotal / selectedSale.totalPlates : 0
                return (
                  <div className="sales-internal-summary mt-6 rounded-2xl border border-[#f1dfb7] bg-[#fffaf0] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a641d]">Internal costing</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div><div className="text-xs text-slate-500">Making / plate</div><div className="mt-1 font-semibold">{formatCurrency(costPerPlate)}</div></div>
                      <div><div className="text-xs text-slate-500">Selling / plate</div><div className="mt-1 font-semibold">{formatCurrency(sellingPerPlate)}</div></div>
                      <div><div className="text-xs text-slate-500">Total making cost</div><div className="mt-1 font-semibold">{formatCurrency(makingCost)}</div></div>
                      <div><div className="text-xs text-slate-500">Sale profit</div><div className={`mt-1 font-semibold ${selectedSale.grandTotal - makingCost >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(selectedSale.grandTotal - makingCost)}</div></div>
                    </div>
                  </div>
                )
              })()}

              <div className="rounded-2xl border border-[#e9f1ef] bg-[#f8fffc] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Payment Summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between"><span>Amount Paid</span><span>{formatCurrency(selectedSale.amountPaid || 0)}</span></div>
                  <div className="flex items-center justify-between"><span>Remaining</span><span>{formatCurrency(selectedSale.remaining || 0)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5efee] bg-[#f5fbfa] text-slate-600">
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 pr-4">Qty</th>
                    <th className="py-3 pr-4">Rate</th>
                    <th className="py-3 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.products.map((product) => (
                    <tr key={`${selectedSale.id}-${product.id}`} className="border-b border-[#edf3f2]">
                      <td className="py-3 pr-4 font-medium text-slate-800">{product.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{product.quantity}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatCurrency(product.selling)}</td>
                      <td className="py-3 pr-4 text-slate-800">{formatCurrency(product.quantity * product.selling)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(selectedSale.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Discount</span><span>{formatCurrency(selectedSale.discount)}</span></div>
              <div className="flex items-center justify-between border-t border-[#e5efee] pt-2 text-base font-semibold text-slate-900"><span>Grand Total</span><span>{formatCurrency(selectedSale.grandTotal)}</span></div>
            </div>

            <div className="mt-8 border-t border-[#edf3f2] pt-4 text-sm text-slate-500">
              Thank you for your business. This invoice is generated for SAI GAYATRI INDUSTRIES.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="secondary-btn" onClick={closeInvoice}>Close</button>
              <button type="button" className="primary-btn" onClick={() => window.print()}>Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
