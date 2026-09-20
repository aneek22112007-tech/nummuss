/**
 * Overview Page - /dashboard
 * High-level summary: twin chart, key metrics, recent interventions
 */

import { useRef, useEffect } from 'react'
import { useTwin, useFeed, useCounterfactual } from '../lib/useApi'
import gsap from 'gsap'

export default function Overview() {
  const { data: twinData, loading: twinLoading } = useTwin()
  const { data: decisions } = useFeed('live_paper', 'disciplined')
  const { data: counterfactual } = useCounterfactual()
  const chartRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!twinData || !chartRef.current) return
    
    // Animate chart paths
    const paths = chartRef.current.querySelectorAll('.chart-path')
    paths.forEach((path, i) => {
      gsap.fromTo(
        path,
        { strokeDashoffset: 1000 },
        { strokeDashoffset: 0, duration: 2, ease: 'power2.out', delay: i * 0.2 }
      )
    })
  }, [twinData])

  if (twinLoading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="h-96 flex items-center justify-center">
          <div className="text-snow/40">Loading...</div>
        </div>
      </div>
    )
  }

  const recentInterventions = decisions.filter(d => d.guardrail_result === 'blocked').slice(0, 5)

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      {/* Twin Portfolio Chart */}
      <div>
        <div className="mb-6">
          <h2 className="text-sm uppercase tracking-widest text-snow/40 mb-2">DISCIPLINED VS TWIN</h2>
          <p className="text-2xl font-display text-snow">Portfolio Comparison</p>
        </div>

        {twinData ? (
          <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8">
            <TwinChart data={twinData} chartRef={chartRef} />
          </div>
        ) : (
          <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8 text-center text-snow/40 h-64 flex items-center justify-center">
            No portfolio data available
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-sm uppercase tracking-widest text-snow/40 mb-6">KEY METRICS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="SIGNALS REVIEWED"
            value={counterfactual?.trades_attempted || 0}
            unit="signals"
          />
          <MetricCard
            label="TRADES TAKEN"
            value={counterfactual?.trades_taken?.disciplined || 0}
            unit="trades"
            color="snow"
          />
          <MetricCard
            label="GUARDRAIL BLOCKS"
            value={counterfactual?.guardrail_blocks?.disciplined || 0}
            unit="interventions"
            color="snow"
          />
          <MetricCard
            label="EXPOSURE AVOIDED"
            value={`₹${((counterfactual?.exposure_avoided_inr || 0) / 1000).toFixed(0)}k`}
            unit=""
            color="mint"
          />
        </div>
      </div>

      {/* Recent Interventions */}
      <div>
        <h2 className="text-sm uppercase tracking-widest text-snow/40 mb-6">RECENT INTERVENTIONS</h2>
        <div className="space-y-3">
          {recentInterventions.length > 0 ? (
            recentInterventions.map((decision) => (
              <div
                key={decision.decision_id}
                className="bg-[#111412] border border-snow/10 rounded-xl p-4 hover:border-snow/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-snow/5 border border-snow/10 rounded-lg">
                      <span className="text-xs font-bold text-snow/60 uppercase tracking-wide">BLOCKED</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-snow">{decision.symbol}</p>
                      <p className="text-xs text-snow/50 mt-0.5">
                        {decision.guardrail_reason_label || 'Behavioral check'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-snow/40">
                      {new Date(decision.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-snow/40 mt-0.5">{decision.guardrail_layer}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-snow/40 text-sm py-4">No recent interventions.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TwinChart({ data, chartRef }: { data: any; chartRef: React.RefObject<SVGSVGElement> }) {
  const w = 1000
  const h = 300
  const padX = 50
  const padY = 30

  const { timeline, starting_capital_inr, summary } = data

  const minVal = Math.min(...timeline.map((p: any) => Math.min(p.disciplined_inr, p.twin_inr))) * 0.95
  const maxVal = Math.max(...timeline.map((p: any) => Math.max(p.disciplined_inr, p.twin_inr))) * 1.05

  const scaleX = (i: number) => padX + ((w - padX * 2) * i) / (timeline.length - 1)
  const scaleY = (val: number) => h - padY - ((h - padY * 2) * (val - minVal)) / (maxVal - minVal)

  const pathDisciplined = timeline
    .map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.disciplined_inr)}`)
    .join(' ')
  const pathTwin = timeline
    .map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.twin_inr)}`)
    .join(' ')

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-snow/40 mb-1">STARTING</p>
          <p className="text-xl font-mono font-bold text-snow">₹{(starting_capital_inr / 1000).toFixed(0)}k</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-mint/70 mb-1">DISCIPLINED</p>
          <p className="text-xl font-mono font-bold text-mint">₹{(summary.disciplined_final_inr / 1000).toFixed(0)}k</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-danger/70 mb-1">TWIN</p>
          <p className="text-xl font-mono font-bold text-danger">₹{(summary.twin_final_inr / 1000).toFixed(0)}k</p>
        </div>
      </div>

      {/* Chart */}
      <svg ref={chartRef} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {/* Grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgb(245 244 239 / 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#grid)" />

        {/* Paths */}
        <path
          d={pathTwin}
          className="chart-path"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
        />
        <path
          d={pathDisciplined}
          className="chart-path"
          stroke="#22c55e"
          strokeWidth="2"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
        />

        {/* Legend */}
        <g transform={`translate(${w - 120}, 20)`}>
          <line x1="0" y1="5" x2="20" y2="5" stroke="#22c55e" strokeWidth="2" />
          <text x="25" y="9" fill="#22c55e" fontSize="11" fontFamily="monospace">Disciplined</text>
          <line x1="0" y1="20" x2="20" y2="20" stroke="#ef4444" strokeWidth="2" />
          <text x="25" y="24" fill="#ef4444" fontSize="11" fontFamily="monospace">Twin</text>
        </g>
      </svg>

      {/* Capital difference */}
      <div className="mt-4 text-center">
        <p className="text-sm text-snow/60">
          Capital preserved:{' '}
          <span className="font-mono font-bold text-mint">
            +₹{Math.abs(summary.capital_difference_inr).toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, color = 'snow' }: any) {
  const colorMap = {
    snow: 'text-snow',
    mint: 'text-mint',
    danger: 'text-danger',
  }

  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-3">{label}</p>
      <p className={`text-3xl font-mono font-bold ${colorMap[color as keyof typeof colorMap]} tabular`}>
        {value}
      </p>
      {unit && <p className="text-xs text-snow/50 mt-1">{unit}</p>}
    </div>
  )
}
