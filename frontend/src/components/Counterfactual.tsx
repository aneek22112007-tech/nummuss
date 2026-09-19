import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { DecisionDrawer } from './DecisionDrawer'
import { useCounterfactual, useFeed } from '../lib/useApi'
import type { FeedDecision, CounterfactualResponse } from '../lib/api'
import { counterfactual as mockContent } from '../data/content'

/* ---------- local fallbacks (same numbers as PRD v5.0) ---------- */
const FALLBACK_CF: CounterfactualResponse = {
  mode: 'india_replay',
  trades_attempted: 42,
  trades_taken: { disciplined: 31, twin: 18 },
  guardrail_blocks: { disciplined: 0, twin: 13 },
  exposure_avoided_inr: 18400,
  max_drawdown: { disciplined: '-7.4%', twin: '-16.8%' },
  turnover: { disciplined: '1.8x', twin: '4.1x' },
  capital_difference_inr: 14200,
  top_blocked_behaviors: [
    { label: 'Revenge trading', count: 5 },
    { label: 'Oversized conviction bet', count: 4 },
    { label: 'Trading on hunch / Low evidence', count: 3 },
    { label: 'Loss chasing', count: 1 },
  ],
}



const FALLBACK_FEED: { decisions: FeedDecision[] } = {
  decisions: [
    {
      decision_id: "dec-scen1-disciplined",
      timestamp: "2026-09-18T10:15:00Z",
      mode: "india_replay",
      market_context: "Expiry-Style Volatility",
      agent_role: "disciplined",
      symbol: "NIFTY50",
      action: "hold",
      confidence_tier: "low",
      confidence_raw: 30,
      evidence_quality: "weak",
      sources: [{ signal_id: "sig-nifty-vol", excerpt: "NIFTY 50 spike 150 points in 2 mins without volume." }],
      guardrail_layer: null,
      guardrail_result: "passed",
      guardrail_reason_label: null,
      test_fixture: true,
      trade: { status: "simulated" },
      outcome_tracked: true
    },
    {
      decision_id: "dec-scen1-twin",
      timestamp: "2026-09-18T10:15:00Z",
      mode: "india_replay",
      market_context: "Expiry-Style Volatility",
      agent_role: "undisciplined",
      symbol: "NIFTY50",
      action: "buy",
      confidence_tier: "high",
      confidence_raw: 92,
      evidence_quality: "weak",
      sources: [{ signal_id: "sig-nifty-vol", excerpt: "NIFTY 50 spike 150 points in 2 mins without volume." }],
      guardrail_layer: null,
      guardrail_result: "passed",
      guardrail_reason_label: null,
      test_fixture: true,
      trade: { status: "simulated" },
      outcome_tracked: true
    },
    {
      decision_id: "dec-scen2-disciplined",
      timestamp: "2026-09-18T11:00:00Z",
      mode: "india_replay",
      market_context: "Loss-Streak Re-Entry",
      agent_role: "disciplined",
      symbol: "NIFTY50",
      action: "buy",
      confidence_tier: "high",
      confidence_raw: 88,
      evidence_quality: "medium",
      sources: [{ signal_id: "sig-nifty-reversal", excerpt: "NIFTY 50 bounces off support at 21,480." }],
      guardrail_layer: "behavioral",
      guardrail_result: "blocked_cooldown",
      guardrail_reason_label: "revenge trade after loss",
      test_fixture: true,
      trade: { status: "rejected" },
      outcome_tracked: true
    },
    {
      decision_id: "dec-scen2-twin",
      timestamp: "2026-09-18T11:00:00Z",
      mode: "india_replay",
      market_context: "Loss-Streak Re-Entry",
      agent_role: "undisciplined",
      symbol: "NIFTY50",
      action: "buy",
      confidence_tier: "high",
      confidence_raw: 95,
      evidence_quality: "medium",
      sources: [{ signal_id: "sig-nifty-reversal", excerpt: "NIFTY 50 bounces off support at 21,480." }],
      guardrail_layer: null,
      guardrail_result: "passed",
      guardrail_reason_label: null,
      test_fixture: true,
      trade: { status: "simulated" },
      outcome_tracked: true
    },
    {
      decision_id: "dec-scen3-disciplined",
      timestamp: "2026-09-18T14:30:00Z",
      mode: "india_replay",
      market_context: "Dramatic News, Contradicted",
      agent_role: "disciplined",
      symbol: "NIFTY50",
      action: "sell",
      confidence_tier: "high",
      confidence_raw: 90,
      evidence_quality: "weak",
      sources: [{ signal_id: "sig-news-rumor", excerpt: "Unconfirmed rumor of regulatory crackdown." }],
      guardrail_layer: "evidence",
      guardrail_result: "blocked_unsupported_claim",
      guardrail_reason_label: "trading on hunch",
      test_fixture: true,
      trade: { status: "rejected" },
      outcome_tracked: true
    },
    {
      decision_id: "dec-scen3-twin",
      timestamp: "2026-09-18T14:30:00Z",
      mode: "india_replay",
      market_context: "Dramatic News, Contradicted",
      agent_role: "undisciplined",
      symbol: "NIFTY50",
      action: "sell",
      confidence_tier: "high",
      confidence_raw: 90,
      evidence_quality: "weak",
      sources: [{ signal_id: "sig-news-rumor", excerpt: "Unconfirmed rumor of regulatory crackdown." }],
      guardrail_layer: null,
      guardrail_result: "passed",
      guardrail_reason_label: null,
      test_fixture: true,
      trade: { status: "simulated" },
      outcome_tracked: true
    }
  ],
}

/* ---------- Twin portfolio SVG chart ---------- */
function TwinChart() {
  return (
    <div className="rounded-[22px] border border-snow/10 p-6.5 chart-grid">
      <div className="mb-3.5 flex flex-wrap justify-between gap-2.5 text-[11px] uppercase tracking-[0.16em] text-snow/40">
        <span><b className="font-semibold text-mint">•</b> Disciplined</span>
        <span><b className="font-semibold text-danger">•</b> Undisciplined twin</span>
        <span>{mockContent.chartCaption.start}</span>
      </div>
      <svg viewBox="0 0 500 300" role="img" aria-label="Twin portfolio curves diverging">
        <motion.path
          className="chart-path" stroke="#ef4444"
          d="M10,250 C60,240 90,255 120,235 S180,250 210,215 S280,235 320,195 S400,215 490,185"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.5, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.path
          className="chart-path" stroke="#22c55e"
          d="M10,250 C70,245 110,230 150,225 S230,205 280,180 S380,140 490,95"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.2, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.circle cx="490" cy="95" r="5" fill="#22c55e"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ delay: 2.2, duration: 0.4 }}
          style={{ transformOrigin: '490px 95px' }}
        />
        <motion.circle cx="490" cy="185" r="5" fill="#ef4444"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ delay: 2.4, duration: 0.4 }}
          style={{ transformOrigin: '490px 185px' }}
        />
        <text x="10" y="292" fill="rgba(245,244,239,.4)" fontSize="11" letterSpacing="1">
          {mockContent.chartCaption.clock}
        </text>
        <text x="378" y="80" fill="#22c55e" fontSize="11">+14.2%</text>
        <text x="430" y="175" fill="#ef4444" fontSize="11">-1.4%</text>
      </svg>
    </div>
  )
}

/**
 * Counterfactual section — live data from GET /counterfactual and GET /feed,
 * with decision row click opening the detail drawer.
 */
export function Counterfactual() {
  const { data: cfData, loading: cfLoading } = useCounterfactual()
  const { data: feedData } = useFeed('india_replay', 'disciplined')
  const [activeDecision, setActiveDecision] = useState<FeedDecision | null>(null)

  const cf = cfData ?? FALLBACK_CF

  const rows = [
    { metric: 'Trades attempted', disciplined: String(cf.trades_attempted), twin: String(cf.trades_attempted) },
    { metric: 'Trades taken', disciplined: String(cf.trades_taken.disciplined), twin: String(cf.trades_taken.twin) },
    { metric: 'Guardrail blocks', disciplined: String(cf.guardrail_blocks.disciplined), twin: String(cf.guardrail_blocks.twin), highlightTwin: true },
    { metric: 'Exposure avoided', disciplined: '—', twin: `₹${cf.exposure_avoided_inr.toLocaleString('en-IN')}`, highlightTwin: true },
    { metric: 'Max drawdown', disciplined: cf.max_drawdown.disciplined, twin: cf.max_drawdown.twin },
    { metric: 'Turnover', disciplined: cf.turnover.disciplined, twin: cf.turnover.twin },
  ]

  const handleRowClick = useCallback((dec: FeedDecision) => setActiveDecision(dec), [])
  const decisions = feedData ?? FALLBACK_FEED.decisions

  return (
    <>
      <section id="counterfactual" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">

        <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
          <BracketLabel>{mockContent.label}</BracketLabel>
          <SplitHeading
            className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]"
            lines={[
              'What Did',
              <span key="d" className="text-mint">Discipline</span>,
              'Change?',
            ]}
          />
          <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">{mockContent.lead}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">

          {/* ── Metric table ── */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-snow/10 bg-charcoal-soft/20">
              <div className="flex items-center justify-between border-b border-snow/10 px-6 py-4.5 text-[11px] uppercase tracking-[0.18em] text-snow/40">
                <span>India Replay · same NIFTY evidence</span>
                <div className="flex items-center gap-4">
                  <span className="rounded-full border border-amber/30 px-2.5 py-1 text-[9px] font-bold text-amber/80">Controlled Simulation</span>
                  <span className="flex items-center gap-2 font-bold text-mint">
                    <i className="h-1.5 w-1.5 animate-blink rounded-full bg-mint" />
                    {cfLoading ? 'Loading…' : 'Live'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px_100px] px-6 py-3.5 text-[10px] uppercase tracking-[0.16em] text-snow/40 border-b border-snow/5">
                <span>Metric</span>
                <span className="text-right">Disciplined</span>
                <span className="text-right">Twin</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {cfLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="px-6 py-4 border-b border-snow/5">
                        <div className="skeleton h-4 w-full" />
                      </div>
                    ))
                  : rows.map((row) => (
                      <div
                        key={row.metric}
                        className="tabular grid grid-cols-[1fr_100px_100px] border-b border-snow/5 px-6 py-4 last:border-b-0 transition-colors hover:bg-snow/5"
                      >
                        <span className="text-[14px] text-snow/60">{row.metric}</span>
                        <span className="text-right font-display text-lg">{row.disciplined}</span>
                        <span className={`text-right font-display text-lg ${row.highlightTwin ? 'text-mint' : 'text-snow/40'}`}>
                          {row.twin}
                        </span>
                      </div>
                    ))
                }
              </div>

              <div className="flex items-center justify-between border-t border-snow/10 bg-mint/5 px-6 py-5">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-mint/80">Capital difference</span>
                <span className="font-display text-[clamp(28px,3vw,40px)] leading-none text-mint">
                  ₹{cf.capital_difference_inr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Reveal>

          {/* ── Twin SVG chart ── */}
          <Reveal delay={0.15} className="h-full">
            <div className="h-full flex flex-col">
              <TwinChart />
            </div>
          </Reveal>

          {/* ── Live feed: clickable decision rows ── */}
          {decisions.length > 0 && (
            <Reveal delay={0.3} className="lg:col-span-2">
              <div className="mt-2 overflow-hidden rounded-[22px] border border-snow/10 bg-charcoal-soft/20">
                <div className="border-b border-snow/10 px-6 py-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-snow/40">
                  <span>Decision Feed — Audit Log</span>
                  <span className="text-[9px] text-snow/30">Click row to inspect agent reasoning</span>
                </div>
                
                {/* Desktop Table Header */}
                <div className="hidden md:grid grid-cols-[80px_120px_1fr_1.5fr_120px_40px] items-center gap-4 px-6 py-3 border-b border-snow/5 text-[10px] uppercase tracking-[0.16em] text-snow/30">
                  <span>Action</span>
                  <span>Agent</span>
                  <span>Symbol</span>
                  <span>Market Context</span>
                  <span className="text-right">Result</span>
                  <span />
                </div>

                <div className="flex flex-col">
                  {decisions.map((dec: FeedDecision) => (
                    <button
                      key={dec.decision_id}
                      id={`decision-row-${dec.decision_id}`}
                      className="decision-row-btn w-full text-left"
                      onClick={() => handleRowClick(dec)}
                      aria-label={`View decision detail for ${dec.symbol} ${dec.action}`}
                    >
                      {/* Responsive Grid Row */}
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_120px_1fr_1.5fr_120px_40px] items-center gap-4 px-6 py-3.5 transition-colors hover:bg-snow/5">
                        
                        {/* Action */}
                        <span className={`text-[13px] font-bold uppercase tracking-wider ${dec.action === 'buy' ? 'text-mint' : dec.action === 'sell' ? 'text-danger' : 'text-amber'}`}>
                          {dec.action}
                        </span>

                        {/* Agent (Mobile hidden, Desktop shown) */}
                        <span className="hidden md:block text-[13px] text-snow/50 capitalize">
                          {dec.agent_role}
                        </span>

                        {/* Symbol & Agent (Mobile stacked) / Symbol (Desktop) */}
                        <div className="flex flex-col md:block">
                          <span className="text-[14px] font-medium text-snow/80">{dec.symbol}</span>
                          <span className="text-[11px] text-snow/40 md:hidden capitalize">{dec.agent_role}</span>
                        </div>

                        {/* Context (Hidden on small mobile, visible on desktop/tablet) */}
                        <span className="hidden md:block text-[13px] text-snow/50 truncate">
                          {dec.market_context}
                        </span>

                        {/* Result */}
                        <div className="flex justify-end md:justify-end">
                          <span className={`rounded-md text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 ${
                            dec.guardrail_result === 'passed'
                              ? 'bg-mint/10 border border-mint/20 text-mint'
                              : 'bg-danger/10 border border-danger/20 text-danger'
                          }`}>
                            {dec.guardrail_result === 'passed' ? '✓ Passed' : '✗ Blocked'}
                          </span>
                        </div>

                        {/* Chevron */}
                        <span className="text-[14px] text-snow/20 md:text-right">›</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Decision Drawer */}
      <DecisionDrawer decision={activeDecision} onClose={() => setActiveDecision(null)} />
    </>
  )
}
