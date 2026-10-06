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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6">
          <div className="invoice-print-area max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[26px] border border-[#dce8e3] bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.2)] sm:p-8">
            <div className="flex flex-col gap-5 border-b-2 border-[#dce8e3] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <img src="/brand-mark.svg" alt="" className="invoice-brand-mark rounded-2xl" />
                  <div>
                    <div className="text-xl font-extrabold tracking-[-0.04em] text-[#123f3a] sm:text-2xl">SAI GAYATRI</div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a7840]">Industries</div>
                  </div>
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tax Invoice / Sales Invoice</div>
              </div>
              <div className="rounded-2xl border border-[#dce8e3] bg-[#f5faf7] p-4 text-sm sm:min-w-56 sm:text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#668078]">Invoice Number</div>
                <div className="mt-1 break-all text-base font-bold text-[#123f3a]">{selectedSale.id}</div>
                <div className="mt-3 flex justify-between gap-6 sm:justify-end"><span className="text-slate-500">Date</span><span className="font-semibold">{selectedSale.saleDate}</span></div>
                <div className="mt-1 flex justify-between gap-6 sm:justify-end"><span className="text-slate-500">Status</span><span className="font-semibold">{selectedSale.paymentStatus}</span></div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-[#e4ece7] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#668078]">Bill To</div>
                <div className="mt-3 text-lg font-bold text-slate-900">{selectedSale.customerName}</div>
                <div className="mt-1 text-sm text-slate-600">Mobile: {selectedSale.mobile}</div>
              </div>

              <div className="rounded-2xl border border-[#e4ece7] bg-[#f8fbf9] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#668078]">Payment Summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between"><span>Amount Paid</span><span>{formatCurrency(selectedSale.amountPaid || 0)}</span></div>
                  <div className="flex items-center justify-between"><span>Remaining</span><span>{formatCurrency(selectedSale.remaining || 0)}</span></div>
                </div>
              </div>
            </div>

            {(() => {
              const makingCost = selectedSale.products.reduce((sum, product) => sum + product.quantity * product.purchaseCost, 0)
              const sellingTotal = selectedSale.products.reduce((sum, product) => sum + product.quantity * product.selling, 0)
              const costPerPlate = selectedSale.totalPlates > 0 ? makingCost / selectedSale.totalPlates : 0
              const sellingPerPlate = selectedSale.totalPlates > 0 ? sellingTotal / selectedSale.totalPlates : 0
              return (
                <div className="sales-internal-summary mt-5 rounded-2xl border border-[#f1dfb7] bg-[#fffaf0] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a641d]">Internal costing · Not shown on printed invoice</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div><div className="text-xs text-slate-500">Making / plate</div><div className="mt-1 font-semibold">{formatCurrency(costPerPlate)}</div></div>
                    <div><div className="text-xs text-slate-500">Selling / plate</div><div className="mt-1 font-semibold">{formatCurrency(sellingPerPlate)}</div></div>
                    <div><div className="text-xs text-slate-500">Total making cost</div><div className="mt-1 font-semibold">{formatCurrency(makingCost)}</div></div>
                    <div><div className="text-xs text-slate-500">Sale profit</div><div className={`mt-1 font-semibold ${selectedSale.grandTotal - makingCost >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(selectedSale.grandTotal - makingCost)}</div></div>
                  </div>
                </div>
              )
            })()}

            <div className="mt-7 overflow-x-auto">
              <table className="invoice-table min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5efee]">
                    <th className="py-3 pl-3 pr-4">Product Description</th>
                    <th className="py-3 pr-4">Quantity</th>
                    <th className="py-3 pr-4">Unit Price</th>
                    <th className="py-3 pl-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.products.map((product) => (
                    <tr key={`${selectedSale.id}-${product.id}`} className="border-b border-[#edf3f2]">
                      <td className="py-3 pl-3 pr-4 font-medium text-slate-800">{product.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{product.quantity}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatCurrency(product.selling)}</td>
                      <td className="py-3 pl-2 pr-3 text-right font-semibold text-slate-800">{formatCurrency(product.quantity * product.selling)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto w-full max-w-sm rounded-2xl bg-[#f5faf7] p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(selectedSale.subtotal)}</span></div>
              {selectedSale.discount > 0 && <div className="mt-2 flex items-center justify-between"><span>Discount</span><span>- {formatCurrency(selectedSale.discount)}</span></div>}
              <div className="mt-3 flex items-center justify-between border-t border-[#dce8e3] pt-3 text-lg font-bold text-[#123f3a]"><span>Grand Total</span><span>{formatCurrency(selectedSale.grandTotal)}</span></div>
            </div>

            <div className="mt-8 flex flex-col gap-2 border-t border-[#dce8e3] pt-5 text-sm text-slate-600 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-semibold text-[#123f3a]">Thank you for your business.</div>
                <div className="mt-1 text-xs">This is a computer-generated invoice from SAI GAYATRI INDUSTRIES.</div>
              </div>
              <div className="mt-5 w-40 border-t border-slate-400 pt-2 text-center text-xs text-slate-500 sm:mt-0">Authorized Signature</div>
            </div>

            <div className="invoice-modal-actions mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="secondary-btn" onClick={closeInvoice}>Close</button>
              <button type="button" className="primary-btn" onClick={() => window.print()}>Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
