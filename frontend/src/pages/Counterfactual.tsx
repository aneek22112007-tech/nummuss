/**
 * Counterfactual Page - /counterfactual
 * What discipline prevented - forensic evidence
 */

import { useCounterfactual } from '../lib/useApi'

export default function Counterfactual() {
  const { data, loading } = useCounterfactual()

  if (loading) {
    return <div className="p-8 text-center text-snow/40">Loading...</div>
  }

  if (!data) return null

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">Counterfactual Evidence</h1>
        <p className="text-2xl text-amber">WHAT DID DISCIPLINE PREVENT?</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="BLOCKED ACTIONS" value={data.guardrail_blocks.disciplined} color="amber" />
        <MetricCard label="EXPOSURE AVOIDED" value={`₹${(data.exposure_avoided_inr / 1000).toFixed(0)}k`} color="mint" />
        <MetricCard label="TRADE DIFFERENCE" value={`${data.trades_taken.twin - data.trades_taken.disciplined}`} />
        <MetricCard label="CAPITAL DIFFERENCE" value={`₹${(data.capital_difference_inr / 1000).toFixed(0)}k`} color="mint" />
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonCard label="MAX DRAWDOWN" disciplined={data.max_drawdown.disciplined} twin={data.max_drawdown.twin} />
        <ComparisonCard label="TURNOVER" disciplined={data.turnover.disciplined} twin={data.turnover.twin} />
      </div>

      {/* Top Blocked Behaviors */}
      <div>
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-6">TOP BLOCKED BEHAVIORAL PATTERNS</p>
        <div className="space-y-4">
          {data.top_blocked_behaviors.map((behavior, i) => (
            <div key={behavior.label} className="bg-[#111412] border border-snow/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-danger">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-snow">{behavior.label}</p>
                    <p className="text-sm text-snow/50">Behavioral failure mode</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold text-amber">{behavior.count}</p>
                  <p className="text-xs text-snow/40">BLOCKS</p>
                </div>
              </div>
              <div className="h-2 bg-snow/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber rounded-full transition-all duration-700"
                  style={{ width: `${(behavior.count / data.guardrail_blocks.disciplined) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-amber/10 border-2 border-amber rounded-2xl p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-amber mb-3">FORENSIC CONCLUSION</p>
        <p className="text-2xl font-display text-snow">
          Behavioral guardrails prevented <span className="text-amber">{data.guardrail_blocks.disciplined}</span> risky actions
        </p>
        <p className="text-snow/60 mt-2">
          Avoiding <span className="font-mono font-bold">₹{data.exposure_avoided_inr.toLocaleString()}</span> in potential losses
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color = 'snow' }: any) {
  const colorMap = { snow: 'text-snow', mint: 'text-mint', amber: 'text-amber', danger: 'text-danger' }
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-3">{label}</p>
      <p className={`text-3xl font-mono font-bold ${colorMap[color as keyof typeof colorMap]} tabular`}>{value}</p>
    </div>
  )
}

function ComparisonCard({ label, disciplined, twin }: any) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">{label}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-mint/70 mb-1">DISCIPLINED</p>
          <p className="text-2xl font-mono font-bold text-mint">{disciplined}</p>
        </div>
        <span className="text-snow/30">vs</span>
        <div>
          <p className="text-xs text-danger/70 mb-1">TWIN</p>
          <p className="text-2xl font-mono font-bold text-danger">{twin}</p>
        </div>
      </div>
    </div>
  )
}
