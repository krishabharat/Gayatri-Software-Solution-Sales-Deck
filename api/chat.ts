import { createClient } from '@supabase/supabase-js'

async function callGemini(apiKey: string, prompt: string): Promise<{ text: string; model: string } | null> {
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.15 }
          })
        }
      )
      if (resp.ok) {
        const data: any = await resp.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) return { text, model }
      }
    } catch {
      // Try next model
    }
  }
  return null
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const message = String(req.body?.message || '').trim()
  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
  const geminiKey = process.env.GEMINI_API_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured on Vercel.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const [
      { data: sales = [] },
      { data: saleProducts = [] },
      { data: products = [] },
      { data: customers = [] },
      { data: suppliers = [] },
      { data: stockIntakes = [] },
      { data: expenses = [] },
      { data: orders = [] }
    ] = await Promise.all([
      supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(500),
      supabase.from('sale_products').select('*').limit(1000),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('suppliers').select('*'),
      supabase.from('stock_intakes').select('*').order('date', { ascending: false }).limit(300),
      supabase.from('business_expenses').select('*').order('date', { ascending: false }).limit(300),
      supabase.from('order_queries').select('*').order('order_date', { ascending: false }).limit(200)
    ])

    const prodMap = new Map((products || []).map((p: any) => [p.id, p]))
    const salesById = new Map((sales || []).map((s: any) => [s.id, s]))

    const enrichedLines = (saleProducts || []).map((sp: any) => {
      const parent = salesById.get(sp.sale_id)
      const qty = Number(sp.quantity || 0)
      const pcost = Number(sp.purchase_cost || 0)
      const sell = Number(sp.selling || 0)
      return {
        sale_id: sp.sale_id,
        sale_date: parent?.sale_date || '',
        customer: parent?.customer_name || '',
        product_id: sp.product_id,
        product_name: sp.product_name,
        quantity: qty,
        line_total: qty * sell,
        line_profit: qty * (sell - pcost)
      }
    })

    const enrichedStock = (stockIntakes || []).map((st: any) => {
      const p = prodMap.get(st.product_id)
      return {
        date: st.date,
        product_id: p?.product_id || st.product_id,
        product_name: p?.product_name || '',
        supplier: st.supplier || '',
        quantity: Number(st.quantity || 0),
        cost_price: Number(st.cost_price || 0),
        type: st.type || 'Purchased'
      }
    })

    // Build compact live JSON context for Gemini
    const liveContext = {
      summary: {
        total_invoices: (sales || []).length,
        total_revenue: (sales || []).reduce((s: number, x: any) => s + Number(x.grand_total || 0), 0),
        total_collected: (sales || []).reduce((s: number, x: any) => s + Number(x.amount_paid || 0), 0),
        total_pending_due: (sales || []).reduce((s: number, x: any) => s + Number(x.remaining || 0), 0),
        total_plates: (sales || []).reduce((s: number, x: any) => s + Number(x.total_plates || 0), 0),
        total_expenses: (expenses || []).reduce((s: number, x: any) => s + Number(x.amount || 0), 0)
      },
      customers,
      suppliers,
      products,
      sales,
      sale_lines: enrichedLines,
      inventory: enrichedStock,
      expenses,
      order_queries: orders
    }

    if (geminiKey) {
      const prompt = `You are the AI Business Intelligence Assistant for Sai Gayatri Industries (a paper & leaf plate factory). Currency is Indian Rupees (₹).
Here is the LIVE Supabase database snapshot in JSON:
${JSON.stringify(liveContext)}

User Question: "${message}"

Analyze the live data accurately and return ONLY a valid JSON object (no markdown fences) with these keys:
{
  "answer": "Clear, insightful answer in natural language with exact names, dates, and ₹ figures.",
  "metrics": [{"label": "Short Label", "value": "₹12,345"}],
  "columns": ["Col1", "Col2", "..."],
  "rows": [["val1", "val2", "..."]],
  "chart": {
    "type": "bar",
    "title": "Chart Title",
    "labels": ["Label1", "Label2"],
    "values": [100, 200],
    "valuePrefix": "₹"
  },
  "suggestions": ["Follow-up question 1", "Follow-up question 2"]
}
If no table or chart is needed, set columns: [], rows: [], chart: null. Never invent data not present in the JSON.`

      const aiRes = await callGemini(geminiKey, prompt)
      if (aiRes) {
        const cleaned = aiRes.text.replace(/^```(?:json)?\s*|\s*```$/gm, '').trim()
        try {
          const parsed = JSON.parse(cleaned)
          return res.status(200).json({
            answer: parsed.answer || 'Analysis complete.',
            engine: `gemini-vercel (${aiRes.model})`,
            rag_sources: (sales || []).length + (customers || []).length,
            type: parsed.rows?.length ? 'table' : parsed.metrics?.length ? 'kpi' : 'text',
            isFullLength: true,
            metrics: parsed.metrics || null,
            columns: parsed.columns || [],
            rows: parsed.rows || [],
            chart: parsed.chart || null,
            suggestions: parsed.suggestions || ['Show all invoices', 'Compare monthly sales', 'Show unpaid dues']
          })
        } catch {
          return res.status(200).json({
            answer: aiRes.text,
            engine: `gemini-vercel (${aiRes.model})`,
            type: 'text',
            suggestions: ['Show all invoices', 'Compare monthly sales']
          })
        }
      }
    }

    // Fallback summary if GEMINI_API_KEY is missing or temporarily unavailable
    return res.status(200).json({
      answer: `Live Supabase Summary: ${liveContext.summary.total_invoices} invoices, Total Revenue ₹${liveContext.summary.total_revenue.toLocaleString()}, Pending Due ₹${liveContext.summary.total_pending_due.toLocaleString()}, Expenses ₹${liveContext.summary.total_expenses.toLocaleString()}. (Add GEMINI_API_KEY in Vercel Environment Variables to enable full Gemini reasoning.)`,
      engine: 'vercel-supabase-fallback',
      type: 'kpi',
      metrics: [
        { label: 'Revenue', value: `₹${liveContext.summary.total_revenue.toLocaleString()}` },
        { label: 'Pending Due', value: `₹${liveContext.summary.total_pending_due.toLocaleString()}` },
        { label: 'Plates Sold', value: liveContext.summary.total_plates.toLocaleString() },
        { label: 'Expenses', value: `₹${liveContext.summary.total_expenses.toLocaleString()}` }
      ],
      suggestions: ['Show all invoices', 'Compare monthly sales', 'Show unpaid dues']
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to query live Supabase data' })
  }
}
