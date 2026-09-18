/**
 * Decision Detail Page - /decisions/:id
 * Full breakdown of a single decision with flow visualization
 */

import { useParams, Link } from 'react-router-dom'
import { useDecision } from '../lib/useApi'

export default function DecisionDetail() {
  const { id } = useParams()
  const { data: decision, loading } = useDecision(id || '')

  if (loading) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto">
        <div className="text-center py-12 text-snow/40">Loading decision...</div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto">
        <div className="text-center py-12">
          <p className="text-snow/40">Decision not found</p>
          <Link to="/decisions" className="text-amber hover:text-amber/80 mt-4 inline-block">
            ← Back to Decisions
          </Link>
        </div>
      </div>
    )
  }

  const isBlocked = decision.guardrail_result === 'blocked'

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8">
      {/* Back button */}
      <Link to="/decisions" className="text-sm text-snow/60 hover:text-snow transition-colors">
        ← Back to Decisions
      </Link>

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">DECISION DETAIL</p>
        <h1 className="text-3xl font-display text-snow">{decision.symbol}</h1>
        <p className="text-sm text-snow/60 mt-2 font-mono">{decision.decision_id}</p>
      </div>

      {/* Overview Card */}
      <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        <DetailField label="TIME" value={new Date(decision.timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })} />
        <DetailField label="MODE" value={decision.mode.toUpperCase()} />
        <DetailField label="AGENT" value={decision.agent_role.toUpperCase()} color={decision.agent_role === 'disciplined' ? 'text-mint' : 'text-danger'} />
        <DetailField 
          label="ACTION" 
          value={decision.action.toUpperCase()} 
          color={decision.action === 'buy' ? 'text-mint' : decision.action === 'sell' ? 'text-danger' : 'text-amber'} 
        />
      </div>

      {/* Evidence & Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111412] border border-snow/10 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">CONFIDENCE</p>
          <p className={`text-2xl font-mono font-bold capitalize ${
            decision.confidence_tier === 'high' ? 'text-mint' : 
            decision.confidence_tier === 'medium' ? 'text-amber' : 'text-danger'
          }`}>
            {decision.confidence_tier}
          </p>
          <p className="text-sm text-snow/50 mt-2">Raw: {(decision.confidence_raw * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-[#111412] border border-snow/10 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">EVIDENCE QUALITY</p>
          <p className={`text-2xl font-mono font-bold capitalize ${
            decision.evidence_quality === 'strong' ? 'text-mint' : 
            decision.evidence_quality === 'medium' ? 'text-amber' : 'text-danger'
          }`}>
            {decision.evidence_quality}
          </p>
          <p className="text-sm text-snow/50 mt-2">{decision.sources.length} sources</p>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="bg-[#060807] border border-snow/10 rounded-2xl p-8">
        <p className="text-xs uppercase tracking-widest text-snow/40 mb-8">DECISION FLOW</p>
        <div className="space-y-6">
          <FlowStep label="SIGNAL" description="Market signal detected" status="completed" />
          <FlowStep label="BEDROCK" description="LLM reasoning processed" status="completed" />
          <FlowStep 
            label="GUARDRAILS" 
            description={isBlocked ? `Blocked by ${decision.guardrail_layer}` : 'Passed all checks'} 
            status={isBlocked ? 'blocked' : 'completed'} 
            highlight={isBlocked}
          />
          <FlowStep label="EVIDENCE" description={`Quality: ${decision.evidence_quality}`} status="completed" />
          <FlowStep label="BEHAVIOR" description={decision.market_context} status="completed" />
          <FlowStep 
            label="PAPER / REPLAY" 
            description={`Trade ${decision.trade.status}`} 
            status={isBlocked ? 'skipped' : 'completed'} 
          />
        </div>
      </div>

      {/* Guardrail Result */}
      {isBlocked && (
        <div className="bg-danger/10 border-2 border-danger rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-danger mb-2">WHERE DID NUMMUSS INTERVENE?</p>
              <p className="text-snow/80 mb-4">{decision.guardrail_reason_label || 'Behavioral check triggered'}</p>
              <p className="text-sm text-snow/60">
                <span className="font-bold">WHY?</span> The guardrail layer <span className="font-mono text-amber">{decision.guardrail_layer}</span> detected a behavioral risk pattern that violated safety constraints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sources */}
      <div>
        <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">EVIDENCE SOURCES</p>
        <div className="space-y-3">
          {decision.sources.map((source) => (
            <div key={source.signal_id} className="bg-[#111412] border border-snow/10 rounded-xl p-4">
              <p className="text-xs font-mono text-snow/40 mb-2">{source.signal_id}</p>
              <p className="text-sm text-snow/80">{source.excerpt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Status */}
      <div className="bg-[#111412] border border-snow/10 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-widest text-snow/40 mb-4">TRADE STATUS</p>
        <p className={`text-xl font-mono font-bold ${
          decision.trade.status === 'executed' ? 'text-mint' : 'text-danger'
        }`}>
          {decision.trade.status.toUpperCase()}
        </p>
        {decision.outcome_tracked && (
          <p className="text-sm text-snow/60 mt-2">Outcome tracked ✓</p>
        )}
      </div>
    </div>
  )
}

function DetailField({ label, value, color = 'text-snow' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">{label}</p>
      <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
    </div>
  )
}

function FlowStep({ label, description, status, highlight = false }: any) {
  const statusColor = 
    status === 'blocked' ? 'bg-danger' :
    status === 'completed' ? 'bg-mint' :
    'bg-snow/20'

  return (
    <div className={`flex items-start gap-4 ${highlight ? 'p-4 bg-danger/5 rounded-lg border border-danger/20' : ''}`}>
      <div className={`w-3 h-3 rounded-full ${statusColor} mt-1.5 flex-shrink-0`} />
      <div className="flex-1">
        <p className={`text-sm font-bold uppercase tracking-wide ${highlight ? 'text-danger' : 'text-snow'}`}>
          {label}
        </p>
        <p className="text-sm text-snow/60 mt-1">{description}</p>
      </div>
    </div>
  )
}
