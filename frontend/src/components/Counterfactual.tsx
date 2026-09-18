import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { DecisionDrawer } from './DecisionDrawer'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'
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
      decision_id: 'dec-seed-101',
      timestamp: '2026-09-18T10:15:00Z',
      mode: 'india_replay',
      market_context: 'INDIA_REPLAY',
      agent_role: 'disciplined',
      symbol: 'NIFTY50',
      action: 'buy',
      confidence_tier: 'high',
      confidence_raw: 88,
      evidence_quality: 'strong',
      sources: [
        { signal_id: 'sig-nifty-01', excerpt: 'NIFTY 50 50-DMA support at 21,480.00' },
        { signal_id: 'sig-nifty-02', excerpt: 'RBI Policy Update: Rates kept unchanged; banking sector surges' },
      ],
      guardrail_layer: null,
      guardrail_result: 'passed',
      guardrail_reason_label: null,
      test_fixture: false,
      trade: { status: 'simulated' },
      outcome_tracked: true,
    },
    {
      decision_id: 'dec-seed-102',
      timestamp: '2026-09-18T10:15:00Z',
      mode: 'india_replay',
      market_context: 'INDIA_REPLAY',
      agent_role: 'undisciplined',
      symbol: 'NIFTY50',
      action: 'buy',
      confidence_tier: 'high',
      confidence_raw: 95,
      evidence_quality: 'weak',
      sources: [{ signal_id: 'sig-nifty-01', excerpt: 'NIFTY 50 50-DMA support' }],
      guardrail_layer: 'behavioral',
      guardrail_result: 'blocked_cooldown',
      guardrail_reason_label: 'revenge trade after loss',
      test_fixture: false,
      trade: { status: 'rejected' },
      outcome_tracked: true,
    },
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
          className="chart-path" stroke="#ff4d3d"
          d="M10,250 C60,240 90,255 120,235 S180,250 210,215 S280,235 320,195 S400,215 490,185"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.5, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.path
          className="chart-path" stroke="#02fa6a"
          d="M10,250 C70,245 110,230 150,225 S230,205 280,180 S380,140 490,95"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.2, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.circle cx="490" cy="95" r="5" fill="#02fa6a"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ delay: 2.2, duration: 0.4 }}
          style={{ transformOrigin: '490px 95px' }}
        />
        <motion.circle cx="490" cy="185" r="5" fill="#ff4d3d"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ delay: 2.4, duration: 0.4 }}
          style={{ transformOrigin: '490px 185px' }}
        />
        <text x="10" y="292" fill="rgba(245,244,239,.4)" fontSize="11" letterSpacing="1">
          {mockContent.chartCaption.clock}
        </text>
        <text x="378" y="80" fill="#02fa6a" fontSize="11">+14.2%</text>
        <text x="430" y="175" fill="#ff4d3d" fontSize="11">-1.4%</text>
      </svg>
    </div>
  )
}

/**
 * Counterfactual section — live data from GET /counterfactual and GET /feed,
 * with decision row click opening the detail drawer.
 */
export function Counterfactual() {
  const { data: cfData, loading: cfLoading } = useApi(api.counterfactual, FALLBACK_CF)
  const { data: feedData } = useApi(() => api.feed(), FALLBACK_FEED)
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
  const decisions = feedData?.decisions ?? FALLBACK_FEED.decisions

  return (
    <>
      <section id="counterfactual" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">

        <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
          <BracketLabel>{mockContent.label}</BracketLabel>
          <SplitHeading className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]" lines={mockContent.headingLines} />
          <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">{mockContent.lead}</p>
        </div>

        <div className="grid items-center gap-[clamp(28px,5vw,72px)] lg:grid-cols-[1.15fr_1fr]">

          {/* ── Metric table ── */}
          <Reveal>
            <div className="overflow-hidden rounded-[22px] border border-snow/10">
              <div className="flex items-center justify-between border-b border-snow/10 px-5.5 py-4 text-[11px] uppercase tracking-[0.18em] text-snow/40">
                <span>India Replay · same NIFTY evidence</span>
                <span className="flex items-center gap-2 text-mint">
                  <i className="h-1.75 w-1.75 animate-blink rounded-full bg-mint" />
                  {cfLoading ? 'Loading…' : 'Live'}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_100px_100px] px-5.5 py-2.5 text-[10px] uppercase tracking-[0.16em] text-snow/40">
                <span>Metric</span>
                <span className="text-right">Disciplined</span>
                <span className="text-right">Twin</span>
              </div>

              {cfLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-5.5 py-3.75 border-b border-snow/5">
                      <div className="skeleton h-4 w-full" />
                    </div>
                  ))
                : rows.map((row) => (
                    <div
                      key={row.metric}
                      className="tabular grid grid-cols-[1fr_100px_100px] border-b border-snow/5 px-5.5 py-3.75 last:border-b-0"
                    >
                      <span className="text-[14px] text-snow/60">{row.metric}</span>
                      <span className="text-right font-display text-lg">{row.disciplined}</span>
                      <span className={`text-right font-display text-lg ${row.highlightTwin ? 'text-mint' : 'text-snow/40'}`}>
                        {row.twin}
                      </span>
                    </div>
                  ))
              }

              <div className="flex items-center justify-between bg-mint/12 px-5.5 py-4.5">
                <span className="text-[12px] uppercase tracking-[0.14em] text-snow/60">Capital difference</span>
                <span className="font-display text-[clamp(24px,2.6vw,34px)] text-mint">
                  ₹{cf.capital_difference_inr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* ── Live feed: clickable decision rows ── */}
            {decisions.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-[16px] border border-snow/8">
                <div className="border-b border-snow/8 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-snow/35">
                  Decision Feed — click a row for full audit
                </div>
                {decisions.map((dec) => (
                  <button
                    key={dec.decision_id}
                    id={`decision-row-${dec.decision_id}`}
                    className="decision-row-btn"
                    onClick={() => handleRowClick(dec)}
                    aria-label={`View decision detail for ${dec.symbol} ${dec.action}`}
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
                      <div>
                        <span className={`text-[13px] font-semibold uppercase ${dec.action === 'buy' ? 'text-mint' : dec.action === 'sell' ? 'text-danger' : 'text-amber'}`}>
                          {dec.action}
                        </span>
                        <span className="ml-2 text-[13px] text-snow/60">{dec.symbol}</span>
                        <span className="ml-1.5 text-[11px] text-snow/30">{dec.agent_role}</span>
                      </div>
                      <span className={`rounded text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 ${
                        dec.guardrail_result === 'passed'
                          ? 'bg-mint/10 text-mint'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {dec.guardrail_result === 'passed' ? '✓ Passed' : '✗ Blocked'}
                      </span>
                      <span className="text-[10px] text-snow/25">›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Reveal>

          {/* ── Twin SVG chart ── */}
          <Reveal delay={0.15}>
            <TwinChart />
          </Reveal>
        </div>
      </section>

      {/* Decision Drawer */}
      <DecisionDrawer decision={activeDecision} onClose={() => setActiveDecision(null)} />
    </>
  )
}
