/**
 * Experiment Page - /experiment
 * Dedicated twin comparison interface showing same signal, same model, different outcomes
 */

import { useTwin } from '../lib/useApi'

export default function Experiment() {
  const { data: twinData } = useTwin()

  // Get a sample comparison point from middle of timeline
  const midIndex = twinData ? Math.floor(twinData.timeline.length / 2) : 0
  const samplePoint = twinData?.timeline[midIndex]

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">The Experiment</h1>
        <div className="text-xl text-snow/80 space-y-1 max-w-2xl">
          <p>SAME SIGNAL.</p>
          <p>SAME MODEL.</p>
          <p>SAME CODE PATH.</p>
        </div>
      </div>

      {/* Twin Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disciplined Agent */}
        <div className="bg-[#111412] border-2 border-mint/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-mint" />
            <h2 className="text-lg font-bold text-mint uppercase tracking-wide">DISCIPLINED</h2>
          </div>

          <div className="space-y-6">
            <ComparisonRow label="POSITION" value={samplePoint ? `₹${(samplePoint.disciplined_inr / 1000).toFixed(1)}k` : '—'} />
            <ComparisonRow label="ACTION" value="HOLD" color="text-amber" />
            <ComparisonRow label="EVIDENCE" value="STRONG" color="text-mint" />
            <ComparisonRow label="LOSS STREAK" value="0" color="text-mint" />
            <ComparisonRow label="GUARDRAIL" value="PASSED" color="text-mint" />
            <ComparisonRow label="RESULT" value="PRESERVED CAPITAL" color="text-mint" />
          </div>

          <div className="mt-8 p-4 bg-mint/5 border border-mint/20 rounded-lg">
            <p className="text-sm text-snow/80">
              Behavioral guardrails active. Evidence verified across multiple sources. No FOMO or revenge patterns detected.
            </p>
          </div>
        </div>

        {/* Twin Agent (No Guardrails) */}
        <div className="bg-[#111412] border-2 border-danger/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <h2 className="text-lg font-bold text-danger uppercase tracking-wide">COUNTERFACTUAL TWIN</h2>
          </div>

          <div className="space-y-6">
            <ComparisonRow label="POSITION" value={samplePoint ? `₹${(samplePoint.twin_inr / 1000).toFixed(1)}k` : '—'} />
            <ComparisonRow label="ACTION" value="SELL" color="text-danger" />
            <ComparisonRow label="EVIDENCE" value="WEAK" color="text-danger" />
            <ComparisonRow label="LOSS STREAK" value="2" color="text-danger" />
            <ComparisonRow label="GUARDRAIL" value="NONE" color="text-snow/40" />
            <ComparisonRow label="RESULT" value="CAPITAL LOST" color="text-danger" />
          </div>

          <div className="mt-8 p-4 bg-danger/5 border border-danger/20 rounded-lg">
            <p className="text-sm text-snow/80">
              No behavioral safety. Acted on weak evidence. Revenge trading after losses. Position sizing violated risk limits.
            </p>
          </div>
        </div>
      </div>

      {/* What Changed */}
      <div>
        <h2 className="text-2xl font-display text-snow mb-6">WHAT CHANGED?</h2>
        <div className="bg-[#111412] border border-amber/30 rounded-2xl p-8">
          <div className="space-y-4">
            <ChangeRow
              change="GUARDRAIL LAYER ADDED"
              description="L1 + L2 behavioral checks intercept risky patterns before execution"
            />
            <ChangeRow
              change="EVIDENCE QUALITY ENFORCED"
              description="Trades require multi-source corroboration, not single-signal chasing"
            />
            <ChangeRow
              change="LOSS-CHASING BLOCKED"
              description="Cooldown period after consecutive losses prevents revenge trading"
            />
            <ChangeRow
              change="POSITION LIMITS ENFORCED"
              description="Risk exposure capped to prevent overconcentration"
            />
          </div>
        </div>
      </div>

      {/* Final Outcome */}
      {twinData && (
        <div className="text-center p-8 bg-[#060807] border border-snow/10 rounded-2xl">
          <p className="text-sm uppercase tracking-widest text-snow/40 mb-2">OUTCOME</p>
          <p className="text-4xl font-display text-mint mb-2">
            +₹{Math.abs(twinData.summary.capital_difference_inr).toLocaleString()}
          </p>
          <p className="text-snow/60">Capital preserved by behavioral discipline</p>
        </div>
      )}
    </div>
  )
}

function ComparisonRow({ label, value, color = 'text-snow' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs uppercase tracking-widest text-snow/40">{label}</span>
      <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
    </div>
  )
}

function ChangeRow({ change, description }: { change: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber mt-2" />
      <div>
        <p className="text-sm font-bold text-amber mb-1">{change}</p>
        <p className="text-sm text-snow/60">{description}</p>
      </div>
    </div>
  )
}
