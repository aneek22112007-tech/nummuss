import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { FeedDecision } from '../lib/api'

type Props = {
  decision: FeedDecision | null
  onClose: () => void
}

const TIER_COLOR: Record<string, string> = {
  high: 'text-mint',
  medium: 'text-amber',
  low: 'text-danger',
}

const QUALITY_COLOR: Record<string, string> = {
  strong: 'text-mint border-mint/30 bg-mint/10',
  medium: 'text-amber border-amber/30 bg-amber/10',
  weak: 'text-danger border-danger/30 bg-danger/10',
}

const ACTION_COLOR: Record<string, string> = {
  buy: 'text-mint',
  sell: 'text-danger',
  hold: 'text-amber',
}

/**
 * Full-detail slide-in drawer for a single DecisionRecord.
 * Shows evidence citations, guardrail audit trail, and trade outcome.
 */
export function DecisionDrawer({ decision, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {decision && (
        <>
          {/* Backdrop */}
          <motion.div
            id="decision-drawer-backdrop"
            className="decision-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            id="decision-drawer-panel"
            className="decision-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Header */}
            <div className="decision-drawer-header">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-snow/40">Decision Record</p>
                <h2 className="font-display text-[22px] uppercase tracking-wide">{decision.symbol}</h2>
              </div>
              <button
                id="decision-drawer-close"
                aria-label="Close decision detail"
                onClick={onClose}
                className="decision-drawer-close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="decision-drawer-body">

              {/* Action & confidence */}
              <section className="drawer-section">
                <p className="drawer-section-label">Decision</p>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className={`font-display text-[42px] uppercase leading-none ${ACTION_COLOR[decision.action] ?? ''}`}>
                    {decision.action}
                  </span>
                  <span className={`text-[13px] font-semibold uppercase tracking-[0.12em] ${TIER_COLOR[decision.confidence_tier] ?? ''}`}>
                    {decision.confidence_tier} confidence · {decision.confidence_raw}%
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-snow/40">
                  <span>{decision.agent_role === 'disciplined' ? '🟢 Disciplined Agent' : '🔴 Undisciplined Twin'}</span>
                  <span>·</span>
                  <span>{decision.mode.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>{new Date(decision.timestamp).toLocaleString()}</span>
                </div>
              </section>

              {/* Evidence Quality */}
              <section className="drawer-section">
                <p className="drawer-section-label">Evidence Quality</p>
                <span className={`inline-block rounded-md border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] ${QUALITY_COLOR[decision.evidence_quality] ?? ''}`}>
                  {decision.evidence_quality}
                </span>
              </section>

              {/* Signal Citations */}
              <section className="drawer-section">
                <p className="drawer-section-label">Signal Citations ({decision.sources.length})</p>
                {decision.sources.length === 0 ? (
                  <p className="text-[13px] text-snow/40 italic">No sources cited.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {decision.sources.map((src) => (
                      <li
                        key={src.signal_id}
                        className="rounded-[10px] border border-snow/8 bg-snow/3 px-4 py-3"
                      >
                        <p className="mb-0.5 font-mono text-[11px] text-mint/70">{src.signal_id}</p>
                        <p className="text-[13.5px] leading-snug text-snow/80">&ldquo;{src.excerpt}&rdquo;</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Guardrail Audit */}
              <section className="drawer-section">
                <p className="drawer-section-label">Guardrail Audit</p>
                <div className={`rounded-[12px] border px-5 py-4 ${
                  decision.guardrail_result === 'passed'
                    ? 'border-mint/25 bg-mint/8'
                    : 'border-danger/25 bg-danger/8'
                }`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-[11px] uppercase tracking-[0.16em] font-bold ${decision.guardrail_result === 'passed' ? 'text-mint' : 'text-danger'}`}>
                      {decision.guardrail_result.replace(/_/g, ' ')}
                    </span>
                    {decision.guardrail_layer && (
                      <span className="rounded border border-snow/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-snow/40">
                        Layer: {decision.guardrail_layer}
                      </span>
                    )}
                  </div>
                  {decision.guardrail_reason_label && (
                    <p className="text-[13px] text-snow/60">
                      Failure mode: <span className="font-semibold text-amber">{decision.guardrail_reason_label}</span>
                    </p>
                  )}
                </div>
              </section>

              {/* Trade Outcome */}
              <section className="drawer-section">
                <p className="drawer-section-label">Trade Outcome</p>
                <div className="flex flex-wrap gap-3">
                  <span className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] ${
                    decision.trade.status === 'simulated'
                      ? 'border-mint/30 text-mint'
                      : 'border-danger/30 text-danger'
                  }`}>
                    {decision.trade.status}
                  </span>
                  {decision.test_fixture && (
                    <span className="rounded-full border border-amber/30 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-amber">
                      Test Fixture
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-snow/30">
                  Outcome tracked: {decision.outcome_tracked ? 'Yes' : 'No'} · Simulation only · No real capital
                </p>
              </section>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
