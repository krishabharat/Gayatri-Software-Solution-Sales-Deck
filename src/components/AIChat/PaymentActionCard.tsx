import { useEffect, useState } from 'react'
import { getCloudSalesRecords, markCloudSalePaid } from '../../utils/cloudStorage'
import type { SaleRecord } from '../../utils/storage'

interface PaymentActionCardProps {
  queryFilter: string
  onPaid: (updatedSales: SaleRecord[]) => void
  onCancel?: () => void
}

export default function PaymentActionCard({ queryFilter, onPaid, onCancel }: PaymentActionCardProps) {
  const [matchingSales, setMatchingSales] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getCloudSalesRecords()
      .then((allSales) => {
        const unpaid = allSales.filter((s) => s.paymentStatus !== 'Paid' || s.remaining > 0)
        const q = queryFilter.toLowerCase().trim()

        // Match by invoice ID or customer name tokens
        const invMatch = q.match(/\bsg\d{8,}\b/i)
        let matched: SaleRecord[] = []
        if (invMatch) {
          const targetId = invMatch[0].toUpperCase()
          matched = unpaid.filter((s) => s.id.toUpperCase() === targetId)
        } else {
          const tokens = q
            .replace(/payment|received|cleared|mark|paid|for|invoice|of|due|pending/gi, ' ')
            .split(/\s+/)
            .filter((t) => t.length >= 2)

          if (tokens.length > 0) {
            matched = unpaid.filter((s) =>
              tokens.some((tok) => s.customerName.toLowerCase().includes(tok))
            )
          } else {
            matched = unpaid
          }
        }
        setMatchingSales(matched)
      })
      .catch(() => {
        setMatchingSales([])
        setError('Unable to load unpaid invoices from Supabase.')
      })
      .finally(() => setLoading(false))
  }, [queryFilter])

  const handleMarkPaid = async (sale: SaleRecord) => {
    setProcessingId(sale.id)
    setError('')
    try {
      await markCloudSalePaid(sale)
      const updated = { ...sale, paymentStatus: 'Paid' as const, amountPaid: sale.grandTotal, remaining: 0 }
      setMatchingSales((prev) => prev.filter((item) => item.id !== sale.id))
      onPaid([updated])
    } catch (err: any) {
      setError(err?.message || 'Failed to mark invoice as paid.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAllPaid = async () => {
    if (matchingSales.length === 0) return
    setProcessingId('ALL')
    setError('')
    try {
      const updatedList: SaleRecord[] = []
      for (const s of matchingSales) {
        await markCloudSalePaid(s)
        updatedList.push({ ...s, paymentStatus: 'Paid', amountPaid: s.grandTotal, remaining: 0 })
      }
      setMatchingSales([])
      onPaid(updatedList)
    } catch (err: any) {
      setError(err?.message || 'Failed to update invoices.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="w-full rounded-2xl border-2 border-[#C67D3B]/45 bg-[#FFFDF9] p-4 shadow-md sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-[#E6D7C3] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            ₹
          </span>
          <div>
            <h4 className="text-sm font-extrabold text-[#2B1810]">Payment Clearance / Mark Paid</h4>
            <p className="text-[11px] text-[#7A5C48]">Confirm payment received to mark invoice(s) as Paid in Supabase</p>
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

      {loading ? (
        <div className="py-4 text-center text-xs font-semibold text-[#7A5C48]">Checking unpaid invoices...</div>
      ) : matchingSales.length === 0 ? (
        <div className="rounded-xl border border-[#E6D7C3] bg-[#FAF5EE] p-4 text-center text-xs font-semibold text-[#5C3317]">
          No unpaid or partial invoices found matching your request!
        </div>
      ) : (
        <div className="space-y-2.5">
          {matchingSales.map((sale) => (
            <div
              key={sale.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6D7C3] bg-white p-3.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#2B1810]">{sale.id}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    {sale.paymentStatus}
                  </span>
                </div>
                <div className="mt-0.5 text-xs font-semibold text-[#5C3317]">
                  {sale.customerName} · {sale.saleDate} · {sale.totalPlates} plates
                </div>
                <div className="mt-0.5 text-[11px] text-[#7A5C48]">
                  Total: ₹{sale.grandTotal.toLocaleString()} · Paid: ₹{sale.amountPaid.toLocaleString()} ·{' '}
                  <strong className="text-rose-700">Due: ₹{sale.remaining.toLocaleString()}</strong>
                </div>
              </div>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => handleMarkPaid(sale)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {processingId === sale.id ? 'Updating...' : '✓ Mark Paid'}
              </button>
            </div>
          ))}

          {matchingSales.length > 1 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={processingId !== null}
                onClick={handleMarkAllPaid}
                className="primary-btn px-5 py-2 text-xs font-bold"
              >
                {processingId === 'ALL' ? 'Updating All...' : `✓ Mark All ${matchingSales.length} Invoices Paid`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
