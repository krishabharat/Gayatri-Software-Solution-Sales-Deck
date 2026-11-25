import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import GraphicalChart, { type ChartData } from '../Charts/GraphicalChart'
import QuickSaleCard, { type SalePrefill } from './QuickSaleCard'
import PaymentActionCard from './PaymentActionCard'
import type { SaleRecord } from '../../utils/storage'
import {
  getCloudBusinessExpenses,
  getCloudCustomers,
  getCloudInventoryItems,
  getCloudOrderQueries,
  getCloudProductMasterItems,
  getCloudSalesRecords,
  getCloudSuppliers
} from '../../utils/cloudStorage'
import { syncFullSnapshotToAI, getAIBaseUrl } from '../../utils/aiSync'

export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
  sql?: string
  engine?: string
  rag_sources?: number
  type?: 'kpi' | 'table' | 'text'
  isFullLength?: boolean
  metrics?: Array<{ label: string; value: string }>
  columns?: string[]
  rows?: string[][]
  chart?: ChartData | null
  suggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
  '🧾 Show all invoices',
  '📅 Compare monthly sales',
  '👤 All customers sales history',
  '📆 October 2026 sales',
  '🔍 Sales history of RG Catering',
  '📈 Most profitable products',
  '⚠️ Unpaid & pending dues',
  '📦 Current stock inventory',
  '📉 Operating expenses'
]

function localFallbackQuery(input: string): Omit<ChatMessage, 'id' | 'sender' | 'timestamp'> {
  const q = input.toLowerCase()

  if (q.includes('month') || q.includes('compare') || q.includes('trend')) {
    return {
      text: 'Monthly sales breakdown across 3 active months. Peak revenue was in October 2026 (₹13,747.00).',
      sql: 'SELECT SUBSTR(sale_date, 1, 7) as month, COUNT(*), SUM(total_plates), SUM(grand_total) FROM sales GROUP BY month',
      engine: 'local-fallback',
      type: 'table',
      isFullLength: true,
      columns: ['Month', 'Invoices', 'Plates Sold', 'Total Revenue', 'Collected', 'Pending Due'],
      rows: [
        ['2026-09', '21', '5,210', '₹10,980.00', '₹10,980.00', '₹0.00'],
        ['2026-10', '17', '8,043', '₹13,747.00', '₹13,577.00', '₹170.00'],
        ['2026-11', '1', '750', '₹1,900.00', '₹0.00', '₹1,900.00']
      ],
      chart: {
        type: 'bar',
        title: 'Monthly Revenue Trend (₹)',
        labels: ['Sep 2026', 'Oct 2026', 'Nov 2026'],
        values: [10980, 13747, 1900],
        valuePrefix: '₹'
      },
      suggestions: ['📆 October 2026 sales', '👤 All customers sales history', '📈 Most profitable products']
    }
  }

  if (q.includes('october') || q.includes('2026-10')) {
    return {
      text: 'Sales for October 2026: 17 invoices recorded, totaling Rs. 13,747.00 across 8,043 plates (Rs. 170.00 pending).',
      sql: "SELECT * FROM sales WHERE sale_date LIKE '2026-10%'",
      engine: 'local-fallback',
      type: 'table',
      isFullLength: true,
      metrics: [
        { label: 'October Revenue', value: '₹13,747.00' },
        { label: 'Invoices', value: '17' },
        { label: 'Plates Sold', value: '8,043' },
        { label: 'Pending Due', value: '₹170.00' }
      ],
      columns: ['Invoice ID', 'Date', 'Customer', 'Plates', 'Grand Total', 'Paid', 'Due', 'Status'],
      rows: [
        ['SG2026103100001', '2026-10-31', 'Rajesh CATRING', '200', '₹550.00', '₹500.00', '₹50.00', 'Partial'],
        ['SG2026102900001', '2026-10-29', 'Srikanth', '600', '₹1,602.00', '₹1,602.00', '₹0.00', 'Paid'],
        ['SG2026101900001', '2026-10-19', 'Sree Maha Lakshmi Temple ( A )', '1,000', '₹2,500.00', '₹2,500.00', '₹0.00', 'Paid'],
        ['SG2026101700001', '2026-10-17', 'ADHYADI Sree Maha Lakshmi Temple', '2,500', '₹1,150.00', '₹1,150.00', '₹0.00', 'Paid'],
        ['SG2026100600001', '2026-10-06', 'MAHALAKSHMI TEMPLE TRUST', '200', '₹1,600.00', '₹1,600.00', '₹0.00', 'Paid']
      ],
      suggestions: ['📅 Compare monthly sales', '👤 All customers sales history']
    }
  }

  if (q.includes('rg catering') || q.includes('rg')) {
    return {
      text: '👤 Customer Profile: RG Catering\n• Mobile: 8886565185\n• Orders: 3 invoices | Plates: 2,050 (12in plate: 1,800, 14in plate: 250)\n• Total Spend: Rs. 4,370.00 | Paid: Rs. 2,470.00 | Due: Rs. 1,900.00',
      sql: "SELECT * FROM sales WHERE customer_name LIKE '%RG Catering%'",
      engine: 'local-fallback',
      type: 'table',
      isFullLength: true,
      metrics: [
        { label: 'Total Spend', value: '₹4,370.00' },
        { label: 'Total Paid', value: '₹2,470.00' },
        { label: 'Pending Due', value: '₹1,900.00' },
        { label: 'Plates Bought', value: '2,050' }
      ],
      columns: ['Invoice ID', 'Date', 'Products Purchased', 'Plates', 'Grand Total', 'Paid', 'Due', 'Status'],
      rows: [
        ['SG2026112000001', '2026-11-20', '12in plate, 14in plate', '750', '₹1,900.00', '₹0.00', '₹1,900.00', 'Unpaid'],
        ['SG2026092700001', '2026-09-27', '12in plate', '500', '₹950.00', '₹950.00', '₹0.00', 'Paid'],
        ['SG2026091600003', '2026-09-16', '12in plate', '800', '₹1,520.00', '₹1,520.00', '₹0.00', 'Paid']
      ],
      chart: {
        type: 'bar',
        title: 'RG Catering — Invoice Totals (₹)',
        labels: ['2026-09-16', '2026-09-27', '2026-11-20'],
        values: [1520, 950, 1900],
        valuePrefix: '₹'
      },
      suggestions: ['👤 All customers sales history', '⚠️ Unpaid & pending dues']
    }
  }

  return {
    text: 'Start the Python AI backend (`python backend/run_server.py`) for full Gemini / OpenAI GPT + RAG + SQL across every date, month, customer, and Excel file.',
    sql: 'SELECT SUM(grand_total) FROM sales;',
    engine: 'local-fallback',
    type: 'kpi',
    metrics: [
      { label: 'Revenue', value: '₹26,627.00' },
      { label: 'Expenses', value: '₹10,739.96' },
      { label: 'Net Profit', value: '₹15,887.04' },
      { label: 'Plates Sold', value: '14,003' }
    ],
    suggestions: ['📅 Compare monthly sales', '👤 All customers sales history', '📆 October 2026 sales']
  }
}

export default function AIChatWidget({ inline = false }: { inline?: boolean }) {
  const [searchParams] = useSearchParams()
  const [isOpen, setIsOpen] = useState(inline)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [ragDocsCount, setRagDocsCount] = useState<number>(0)
  const [activeProvider, setActiveProvider] = useState<string>('auto')
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  const [openaiConfigured, setOpenaiConfigured] = useState(false)

  // Settings Modal state
  const [showSettings, setShowSettings] = useState(false)
  const [providerInput, setProviderInput] = useState('auto')
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [openaiKeyInput, setOpenaiKeyInput] = useState('')
  const [settingsMsg, setSettingsMsg] = useState('')
  const [syncing, setSyncing] = useState(false)

  const [showSql, setShowSql] = useState<Record<string, boolean>>({})
  const [expandedTable, setExpandedTable] = useState(false)
  const [showQuickSale, setShowQuickSale] = useState(false)
  const [salePrefill, setSalePrefill] = useState<SalePrefill | null>(null)
  const [paymentQuery, setPaymentQuery] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      engine: 'rag-sql-local',
      text: 'Namaste! I am your Hybrid RAG + LLM + SQL Assistant for Sai Gayatri Industries. Ask me any question about any customer, any month (e.g. "October 2026 sales"), any specific date, product profits, inventory, suppliers, or expenses.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'kpi',
      metrics: [
        { label: 'Total Revenue', value: '₹26,627.00' },
        { label: 'Plates Sold', value: '14,003' },
        { label: 'In Stock', value: '8,650 units' },
        { label: 'Pending Dues', value: '₹2,070.00' }
      ],
      chart: {
        type: 'bar',
        title: 'Monthly Sales Revenue Overview (₹)',
        labels: ['Sep 2026', 'Oct 2026', 'Nov 2026'],
        values: [10980, 13747, 1900],
        valuePrefix: '₹'
      },
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 4)
    }
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoQueryHandled = useRef(false)

  const refreshHealth = () => {
    const base = getAIBaseUrl()
    fetch(`${base}/api/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setBackendOnline(true)
        setRagDocsCount(data.rag_documents || 0)
        setActiveProvider(data.provider || 'auto')
        setProviderInput(data.provider || 'auto')
        setGeminiConfigured(Boolean(data.gemini_configured))
        setOpenaiConfigured(Boolean(data.openai_configured))
      })
      .catch(() => setBackendOnline(false))
  }

  useEffect(() => {
    refreshHealth()
  }, [])

  useEffect(() => {
    const qParam = searchParams.get('q')
    if (qParam && inline && !autoQueryHandled.current) {
      autoQueryHandled.current = true
      void sendMessage(qParam)
    }
  }, [searchParams, inline])

  useEffect(() => {
    if (isOpen || inline) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, inline, showQuickSale, paymentQuery])

  const sendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const lowerQ = textToSend.toLowerCase()

    // 1. Detect Payment Received / Cleared / Mark Paid intent
    const isPaymentIntent =
      /\b(payment\s+(received|cleared|done|paid)|mark\s+(as\s+)?paid|clear\s+payment|received\s+payment)\b/.test(lowerQ)
    if (isPaymentIntent) {
      setPaymentQuery(textToSend)
      setShowQuickSale(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-pay-${Date.now()}`,
          sender: 'ai',
          engine: 'payment-update',
          text: '💳 Checking unpaid / partial invoices below. Click "✓ Mark Paid" to update the invoice in Supabase!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      return
    }

    // 2. Detect explicit sale intent OR shorthand sale ("RG Catering 12 500 unpaid")
    const isExplicitSale =
      /\b(make|create|new|add|record|do)\s+(a\s+)?sales?\b/.test(lowerQ) ||
      lowerQ === 'quick sale' ||
      /\bsell\s+\d+/.test(lowerQ)

    const isQuestion = /\b(show|list|what|how|compare|history|total|when|which|who|all)\b|\?/.test(lowerQ)
    const hasPaidWord = /\b(paid|unpaid|partial)\b/.test(lowerQ)
    const nums = lowerQ.match(/\b\d+\b/g) || []
    const isShorthandSale = !isQuestion && hasPaidWord && nums.length >= 1

    if (isExplicitSale || isShorthandSale) {
      const prefill: SalePrefill = {}

      // Detect product: 12 / 12in / p12, 14 / 14in / p14, organic, prasadam, snackes, gold
      let workingText = lowerQ
      if (/\b(12in|12\s*inch|p12)\b/.test(workingText) || /\b12\b/.test(workingText)) {
        prefill.productQuery = '12in'
        workingText = workingText.replace(/\b(12in|12\s*inch|12|p12)\b/g, ' ')
      } else if (/\b(14in|14\s*inch|p14)\b/.test(workingText) || /\b14\b/.test(workingText)) {
        prefill.productQuery = '14in'
        workingText = workingText.replace(/\b(14in|14\s*inch|14|p14)\b/g, ' ')
      } else {
        const prodKeywords = ['organic', 'leaf', 'prasadam', 'bowles', 'snackes', 'gold', 'gp14', 'p005', 'p09', 'p13']
        const foundProd = prodKeywords.find((k) => workingText.includes(k))
        if (foundProd) prefill.productQuery = foundProd
      }

      // Extract remaining number as plates quantity
      const qtyMatch = workingText.match(/\b(\d{1,6})\b/)
      if (qtyMatch) prefill.plates = Number(qtyMatch[1])

      if (lowerQ.includes('unpaid')) prefill.paymentStatus = 'Unpaid'
      else if (lowerQ.includes('partial')) prefill.paymentStatus = 'Partial'
      else if (lowerQ.includes('paid')) prefill.paymentStatus = 'Paid'

      const custKeywords = ['rg catering', 'rajesh', 'srikanth', 'esware', 'kalyani', 'kamesh', 'kartick', 'srinu', 'rudra', 'maha lakshmi', 'adhyadi', 'surya']
      const foundCust = custKeywords.find((k) => lowerQ.includes(k))
      if (foundCust) prefill.customerQuery = foundCust

      setSalePrefill(prefill)
      setPaymentQuery(null)
      setShowQuickSale(true)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-qs-${Date.now()}`,
          sender: 'ai',
          engine: 'quick-sale',
          text: '⚡ Quick Sale pre-filled below! Review Product, Customer, Plates & Paid/Unpaid, then click "✓ Save Sale" to confirm.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      return
    }

    setLoading(true)

    try {
      let data: any
      const base = getAIBaseUrl()
      try {
        const response = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: textToSend })
        })
        if (response.ok) {
          data = await response.json()
          setBackendOnline(true)
        } else {
          throw new Error('Backend error')
        }
      } catch {
        setBackendOnline(false)
        data = localFallbackQuery(textToSend)
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sql: data.sql,
        engine: data.engine,
        rag_sources: data.rag_sources,
        type: data.type || 'text',
        isFullLength: data.isFullLength ?? true,
        metrics: data.metrics,
        columns: data.columns,
        rows: data.rows,
        chart: data.chart || null,
        suggestions: data.suggestions || DEFAULT_SUGGESTIONS.slice(0, 4)
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Unable to complete query: ${err?.message || 'Server error'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: DEFAULT_SUGGESTIONS.slice(0, 3)
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsMsg('')
    try {
      const payload: Record<string, string> = { provider: providerInput }
      if (geminiKeyInput.trim()) payload.gemini_api_key = geminiKeyInput.trim()
      if (openaiKeyInput.trim()) payload.openai_api_key = openaiKeyInput.trim()

      const res = await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setSettingsMsg('✅ AI LLM settings saved! New queries will use your configured LLM + RAG + SQL.')
        setGeminiKeyInput('')
        setOpenaiKeyInput('')
        refreshHealth()
      } else {
        setSettingsMsg('⚠️ Could not save settings. Make sure Python backend is running.')
      }
    } catch {
      setSettingsMsg('⚠️ Python backend offline on port 8000.')
    }
  }

  const handleSyncExcelFolder = async () => {
    setSyncing(true)
    setSettingsMsg('')
    try {
      const res = await fetch('http://localhost:8000/api/sync/folder', { method: 'POST' })
      const data = await res.json()
      setSettingsMsg(`✅ Synced ${data.files_processed?.length || 0} Excel file(s) & rebuilt ${data.rag_documents} RAG records!`)
      refreshHealth()
    } catch {
      setSettingsMsg('⚠️ Python backend offline on port 8000.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncLiveCloud = async () => {
    setSyncing(true)
    setSettingsMsg('')
    try {
      const [sales, inventory, products, expenses, customers, suppliers, orders] = await Promise.all([
        getCloudSalesRecords().catch(() => []),
        getCloudInventoryItems().catch(() => []),
        getCloudProductMasterItems().catch(() => []),
        getCloudBusinessExpenses().catch(() => []),
        getCloudCustomers().catch(() => []),
        getCloudSuppliers().catch(() => []),
        getCloudOrderQueries().catch(() => [])
      ])
      const res = await syncFullSnapshotToAI({ sales, inventory, products, expenses, customers, suppliers, orders })
      if (res) {
        setSettingsMsg(`✅ Live Cloud Data synced! (${sales.length} sales, ${inventory.length} inventory, ${customers.length} customers, ${res.rag_documents} RAG docs)`)
        refreshHealth()
      } else {
        setSettingsMsg('⚠️ Python backend offline on port 8000.')
      }
    } catch {
      setSettingsMsg('⚠️ Failed to sync live cloud data.')
    } finally {
      setSyncing(false)
    }
  }

  const toggleSql = (id: string) => {
    setShowSql((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const chatContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Chocolate Truffle Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5C3317]/20 bg-gradient-to-r from-[#3B2314] via-[#5C3317] to-[#8C4A1F] px-5 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3D5B5] text-[#2B1810] font-extrabold text-sm shadow-xs">
            AI
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">AI Chart & Sales Intelligence</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#F6D5B0] border border-white/15">
                <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {backendOnline
                  ? `RAG (${ragDocsCount} docs) · ${geminiConfigured ? 'Gemini' : openaiConfigured ? 'GPT' : 'SQL'}`
                  : 'Offline Fallback'}
              </span>
            </div>
            <p className="text-[11px] text-[#F3E6D5]/80">Any user, any month, any date · Live Supabase + RAG + SQL + Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickSale((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#F3D5B5] px-3 py-1.5 text-xs font-extrabold text-[#2B1810] shadow-xs transition hover:brightness-105"
            title="Create a Quick Single Sale"
          >
            <span>⚡</span>
            <span>Quick Sale</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            title="Configure Gemini / OpenAI API & Sync Data"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">LLM & Sync</span>
          </button>

          {inline && (
            <button
              onClick={() => setExpandedTable(!expandedTable)}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <span>{expandedTable ? 'Standard Height' : 'Full Height'}</span>
            </button>
          )}
          {!inline && (
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-indigo-200 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Collapsible LLM & Data Sync Settings Drawer */}
      {showSettings && (
        <div className="border-b border-indigo-100 bg-indigo-50/70 p-4 text-xs text-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm text-indigo-950">⚙️ LLM API (Gemini / OpenAI GPT) & Live Data Sync</strong>
            <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-900 font-bold">✕ Close</button>
          </div>
          <form onSubmit={handleSaveSettings} className="grid gap-2.5 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-semibold text-slate-600">AI Provider</label>
              <select
                value={providerInput}
                onChange={(e) => setProviderInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900"
              >
                <option value="auto">Auto ({activeProvider})</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT</option>
                <option value="local">Local RAG + SQL Only</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Gemini API Key {geminiConfigured && <span className="text-emerald-700">(Saved)</span>}
              </label>
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                OpenAI GPT Key {openaiConfigured && <span className="text-emerald-700">(Saved)</span>}
              </label>
              <input
                type="password"
                value={openaiKeyInput}
                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
            <div className="flex items-end gap-1.5">
              <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700">
                Save Keys
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-indigo-200/70 pt-2.5">
            <button
              type="button"
              onClick={handleSyncExcelFolder}
              disabled={syncing}
              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              🔄 Sync `excel_data/` Folder
            </button>
            <button
              type="button"
              onClick={handleSyncLiveCloud}
              disabled={syncing}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              ☁️ Sync Live App Pages to AI
            </button>
            {settingsMsg && <span className="font-semibold text-slate-800">{settingsMsg}</span>}
          </div>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#E6D7C3] bg-[#FAF5EE] px-4 py-2.5">
        <button
          onClick={() => setShowQuickSale(true)}
          className="flex-shrink-0 rounded-full border border-[#8C4A1F] bg-[#5C3317] px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#4A2811] active:scale-95"
        >
          ⚡ Make Quick Sale
        </button>
        {DEFAULT_SUGGESTIONS.map((item) => (
          <button
            key={item}
            onClick={() => sendMessage(item.replace(/^[^\w]+/, '').trim())}
            className="flex-shrink-0 rounded-full border border-[#D9C3A8] bg-white px-3 py-1 text-xs font-semibold text-[#3B2314] shadow-xs transition hover:border-[#C67D3B] hover:bg-[#F3E6D5] active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#FAF5EE]/50 p-4 sm:p-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>{m.sender === 'user' ? 'You' : 'AI Assistant'} · {m.timestamp}</span>
              {m.sender === 'ai' && m.engine && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-100">
                  {m.engine}
                </span>
              )}
              {m.sender === 'ai' && typeof m.rag_sources === 'number' && m.rag_sources > 0 && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                  {m.rag_sources} RAG hits
                </span>
              )}
            </div>

            <div
              className={`rounded-2xl p-4 sm:p-5 transition-all ${
                m.sender === 'user'
                  ? 'max-w-[85%] bg-gradient-to-r from-[#5C3317] to-[#8C4A1F] text-white shadow-xs font-medium text-sm'
                  : 'w-full border border-[#E6D7C3] bg-white text-[#2B1810] shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                {m.text}
              </div>

              {/* KPI Cards */}
              {m.metrics && m.metrics.length > 0 && (
                <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {m.metrics.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {kpi.label}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Graphical Chart inside AI Response */}
              {m.chart && <GraphicalChart chart={m.chart} />}

              {/* Full-Length Data Table */}
              {m.type === 'table' && m.columns && m.rows && m.rows.length > 0 && (
                <div className="mt-4 w-full overflow-x-auto rounded-xl border border-[#E6D7C3]">
                  <table className="w-full text-left text-xs font-medium text-[#2B1810]">
                    <thead className="bg-[#3B2314] text-[#FFFDF9] font-semibold">
                      <tr>
                        {m.columns.map((col, idx) => (
                          <th key={idx} className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {m.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40' : 'bg-slate-50/60 hover:bg-indigo-50/40'}>
                          {row.map((cell, cIdx) => {
                            const isStatus = cell === 'Fully Paid' || cell === 'Paid' || cell === 'Unpaid' || cell === 'Partial Due' || cell === 'Partial'
                            const isPending = cell === 'Unpaid' || cell === 'Partial Due' || cell === 'Partial'
                            const isInvoiceId = /^SG\d{8,}$/i.test(cell.trim())
                            return (
                              <td key={cIdx} className="whitespace-nowrap px-4 py-2.5 font-medium">
                                {isStatus ? (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    isPending
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {cell}
                                  </span>
                                ) : isInvoiceId ? (
                                  <button
                                    type="button"
                                    onClick={() => void sendMessage(cell.trim())}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#FAF5EE] px-2 py-0.5 font-bold text-[#8C4A1F] border border-[#D9C3A8] underline decoration-[#C67D3B] hover:bg-[#F3E6D5] transition"
                                    title="Click to inspect invoice items or mark paid"
                                  >
                                    <span>{cell}</span>
                                    <span className="text-[10px]">↗</span>
                                  </button>
                                ) : (
                                  cell
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transparent SQL Viewer */}
              {m.sql && (
                <div className="mt-3 border-t border-slate-100 pt-2.5">
                  <button
                    onClick={() => toggleSql(m.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <span>{showSql[m.id] ? '▾ Hide' : '▸ Show'} SQL Database Query</span>
                  </button>
                  {showSql[m.id] && (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs font-mono text-indigo-200">
                      <code>{m.sql}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>

            {m.suggestions && m.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(s.replace(/^[^\w]+/, '').trim())}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Running RAG retrieval + SQL query...
          </div>
        )}
        {showQuickSale && (
          <QuickSaleCard
            prefill={salePrefill}
            onCancel={() => {
              setShowQuickSale(false)
              setSalePrefill(null)
            }}
            onSuccess={(sale: SaleRecord, productName: string) => {
              setShowQuickSale(false)
              setSalePrefill(null)
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-sale-done-${Date.now()}`,
                  sender: 'ai',
                  engine: 'live-supabase',
                  text: `✅ Sale Saved Successfully!\n• Invoice ID: ${sale.id}\n• Customer: ${sale.customerName} (${sale.mobile})\n• Product: ${productName} × ${sale.totalPlates} plates\n• Total: ₹${sale.grandTotal.toLocaleString()} | Paid: ₹${sale.amountPaid.toLocaleString()} | Due: ₹${sale.remaining.toLocaleString()} (${sale.paymentStatus})`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  metrics: [
                    { label: 'Invoice', value: sale.id },
                    { label: 'Total', value: `₹${sale.grandTotal.toLocaleString()}` },
                    { label: 'Paid', value: `₹${sale.amountPaid.toLocaleString()}` },
                    { label: 'Status', value: sale.paymentStatus }
                  ],
                  suggestions: [
                    `Sales history of ${sale.customerName}`,
                    'Compare monthly sales',
                    'Show unpaid dues'
                  ]
                }
              ])
            }}
          />
        )}
        {paymentQuery && (
          <PaymentActionCard
            queryFilter={paymentQuery}
            onCancel={() => setPaymentQuery(null)}
            onPaid={(updatedList) => {
              setPaymentQuery(null)
              const summaryLines = updatedList
                .map((s) => `• ${s.id} — ${s.customerName} (₹${s.grandTotal.toLocaleString()} marked Paid)`)
                .join('\n')
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-paid-done-${Date.now()}`,
                  sender: 'ai',
                  engine: 'live-supabase',
                  text: `✅ Payment Updated Successfully!\n${summaryLines}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  suggestions: ['Show unpaid dues', 'Show all invoices', 'Compare monthly sales']
                }
              ])
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200 bg-white p-3.5 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything: 'October 2026 sales', 'Sales on 2026-10-19', 'RG Catering history', 'Top products'..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-40 active:scale-98"
          >
            <span>Ask AI</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className={expandedTable ? 'h-[760px]' : 'h-[600px]'}>
          {chatContent}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-[#5C3317] to-[#B46528] px-5 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:brightness-105 border border-[#C67D3B]/40"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFDF9] text-[#5C3317] font-extrabold text-xs">
              AI
            </span>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#F6D5B0]">Gemini AI</div>
              <div className="text-xs font-semibold text-white">Ask AI Chart</div>
            </div>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[660px] w-[min(96vw,580px)] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl transition-all">
          {chatContent}
        </div>
      )}
    </>
  )
}
