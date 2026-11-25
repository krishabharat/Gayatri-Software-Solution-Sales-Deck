export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    environment: 'vercel-serverless',
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    supabase_configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    provider: 'gemini',
    version: '2.1.0'
  })
}
