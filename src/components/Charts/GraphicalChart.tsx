export interface ChartData {
  type?: 'bar' | 'pie'
  title: string
  labels: string[]
  values: number[]
  valuePrefix?: string
}

// Chocolate Truffle Graphical Palette: Dark Espresso, Roasted Cocoa, Warm Caramel, Honey Gold, Mocha, Terracotta
const PALETTE = [
  '#5C3317', // Dark Chocolate
  '#C67D3B', // Warm Caramel
  '#8C4A1F', // Roasted Cocoa
  '#D99B52', // Honey Gold
  '#3B2314', // Espresso
  '#A55E22', // Burnt Amber
  '#7A5C48', // Mocha
  '#B45309'  // Deep Amber
]

export default function GraphicalChart({ chart }: { chart: ChartData }) {
  if (!chart || !chart.labels || chart.labels.length === 0) return null

  const maxVal = Math.max(...chart.values.map((v) => Math.abs(v)), 1)
  const prefix = chart.valuePrefix || ''

  return (
    <div className="mt-4 rounded-xl border border-[#E6D7C3] bg-[#FAF5EE]/75 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-[#5C3317]">
          📊 {chart.title}
        </div>
        <span className="rounded-md border border-[#D9C3A8] bg-[#FFFDF9] px-2 py-0.5 text-[10px] font-bold text-[#8C4A1F]">
          Visual Chart
        </span>
      </div>

      {/* Interactive Vertical Bar Chart */}
      <div className="flex h-44 items-end gap-2 sm:gap-3 border-b border-[#D9C3A8] pb-2 pt-6">
        {chart.labels.map((label, idx) => {
          const val = chart.values[idx] ?? 0
          const pct = Math.max(8, Math.round((Math.abs(val) / maxVal) * 100))
          const color = PALETTE[idx % PALETTE.length]
          return (
            <div key={`${label}-${idx}`} className="group relative flex flex-1 flex-col items-center justify-end h-full min-w-[28px]">
              <div className="mb-1 text-[10px] font-bold text-[#3B2314] opacity-90 truncate max-w-full">
                {prefix}{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString()}
              </div>
              <div
                className="w-full max-w-[44px] rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-xs"
                style={{ height: `${pct}%`, backgroundColor: color }}
                title={`${label}: ${prefix}${val.toLocaleString()}`}
              />
            </div>
          )
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="mt-2 flex gap-2 sm:gap-3">
        {chart.labels.map((label, idx) => (
          <div key={`lbl-${idx}`} className="flex-1 text-center text-[10px] font-semibold text-[#6F452B] truncate" title={label}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
