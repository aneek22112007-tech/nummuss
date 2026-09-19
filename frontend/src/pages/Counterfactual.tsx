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

  if (!data) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-display text-snow mb-4">Counterfactual Evidence</h1>
          <p className="text-2xl text-snow/80">WHAT DID DISCIPLINE PREVENT?</p>
        </div>
        <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8 text-center text-snow/40 h-64 flex items-center justify-center">
          No counterfactual data available
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">Counterfactual Evidence</h1>
        <p className="text-2xl text-snow/80">WHAT DID DISCIPLINE PREVENT?</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="BLOCKED ACTIONS" value={data.guardrail_blocks.disciplined} />
        <MetricCard label="EXPOSURE AVOIDED" value={`₹${(data.exposure_avoided_inr / 1000).toFixed(0)}k`} />
        <MetricCard label="TRADE DIFFERENCE" value={`${data.trades_taken.twin - data.trades_taken.disciplined}`} />
        <MetricCard label="CAPITAL DIFFERENCE" value={`₹${(data.capital_difference_inr / 1000).toFixed(0)}k`} />
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
                  <div className="w-10 h-10 rounded-lg bg-snow/5 border border-snow/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-snow/60">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-snow">{behavior.label}</p>
                    <p className="text-sm text-snow/50">Behavioral failure mode</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold text-snow/80">{behavior.count}</p>
                  <p className="text-xs text-snow/40">BLOCKS</p>
                </div>
              </div>
              <div className="h-2 bg-snow/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-snow rounded-full transition-all duration-700"
                  style={{ width: `${(behavior.count / data.guardrail_blocks.disciplined) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-snow/5 border-2 border-snow/10 rounded-2xl p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-snow/80 mb-3">FORENSIC CONCLUSION</p>
        <p className="text-2xl font-display text-snow">
          Behavioral guardrails prevented <span className="text-snow/80">{data.guardrail_blocks.disciplined}</span> risky actions
        </p>
        <p className="text-snow/60 mt-2">
          Avoiding <span className="font-mono font-bold">₹{data.exposure_avoided_inr.toLocaleString()}</span> in potential losses
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: any) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-3">{label}</p>
      <p className="text-3xl font-mono font-bold text-snow tabular">{value}</p>
    </div>
  )
}

function ComparisonCard({ label, disciplined, twin }: any) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">{label}</p>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-mint" />
            <p className="text-xs text-snow/60">DISCIPLINED</p>
          </div>
          <p className="text-2xl font-mono font-bold text-snow">{disciplined}</p>
        </div>
        <span className="text-snow/20 text-sm">vs</span>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-danger" />
            <p className="text-xs text-snow/60">TWIN</p>
          </div>
          <p className="text-2xl font-mono font-bold text-snow">{twin}</p>
        </div>
      </div>
    </div>
  )
}
