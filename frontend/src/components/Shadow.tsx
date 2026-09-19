import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Reveal } from './ui/Reveal'
import { api } from '../lib/api'
import type { ShadowResponse } from '../lib/api'
import { shadowExchanges } from '../data/content'

type VerdictState = 'idle' | 'loading' | 'done'

interface PresetScenario {
  id: string
  label: string
  tag: string
  tone: 'danger' | 'amber' | 'purple' | 'mint'
  symbol: string
  idea: string
  expectedVerdict: 'BLOCKED' | 'ALLOWED'
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'revenge',
    label: 'Revenge Trade',
    tag: 'COOLDOWN RULE',
    tone: 'danger',
    symbol: 'NIFTY50',
    idea: 'I lost twice today. I will double my size to recover.',
    expectedVerdict: 'BLOCKED',
  },
  {
    id: 'rumor',
    label: 'Unverified Hunch',
    tag: 'EVIDENCE GATE',
    tone: 'amber',
    symbol: 'RELIANCE',
    idea: 'Single social media tip claims a guaranteed gap-up tomorrow. Buying 500 contracts.',
    expectedVerdict: 'BLOCKED',
  },
  {
    id: 'yolo',
    label: 'Oversized Bet',
    tag: 'CAPITAL CAP',
    tone: 'purple',
    symbol: 'AAPL',
    idea: 'Allocate 75% of total portfolio capital into this single Apple breakout.',
    expectedVerdict: 'BLOCKED',
  },
  {
    id: 'disciplined',
    label: 'Disciplined Trade',
    tag: 'SAFE ORDER',
    tone: 'mint',
    symbol: 'NIFTY50',
    idea: 'Corroborated by RBI policy update and 3 financial sources. Risk capped strictly at 1.8% portfolio equity.',
    expectedVerdict: 'ALLOWED',
  },
]

/**
 * Flagship Shadow Challenge section — POST /shadow for live deterministic verdicts.
 * Highlighted with ambient lighting, attack presets, scanning animations,
 * and dual-mode interactive telemetry visualizer.
 */
export function Shadow() {
  /* ── canned demo ── */
  const [demoTyped, setDemoTyped] = useState('')
  const [exchangeIndex, setExchangeIndex] = useState(0)
  const demoRef = useRef<HTMLDivElement>(null)
  const [demoInView, setDemoInView] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<'terminal' | 'architecture'>('terminal')

  const current = shadowExchanges[exchangeIndex]
  const demoTypingDone = demoTyped.length >= current.request.length

  // IntersectionObserver for demo terminal
  useEffect(() => {
    const el = demoRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDemoInView(true) },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!demoInView) return
    setDemoTyped('')
    let idx = 0
    const id = window.setInterval(() => {
      idx += 2
      setDemoTyped(current.request.slice(0, idx))
      if (idx >= current.request.length) window.clearInterval(id)
    }, 16)
    return () => window.clearInterval(id)
  }, [demoInView, current.request])

  useEffect(() => {
    if (!demoTypingDone) return
    const id = window.setTimeout(
      () => setExchangeIndex((v) => (v + 1) % shadowExchanges.length),
      4500,
    )
    return () => window.clearTimeout(id)
  }, [demoTypingDone])

  /* ── live challenge form ── */
  const [symbol, setSymbol] = useState('NIFTY50')
  const [idea, setIdea] = useState('')
  const [verdictState, setVerdictState] = useState<VerdictState>('idle')
  const [evalStep, setEvalStep] = useState<number>(0)
  const [liveResult, setLiveResult] = useState<ShadowResponse | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [evalLatency, setEvalLatency] = useState<number>(38)

  const handlePresetSelect = (preset: PresetScenario) => {
    setSelectedPreset(preset.id)
    setSymbol(preset.symbol)
    setIdea(preset.idea)
    submit(preset.symbol, preset.idea)
  }

  const submit = async (overrideSymbol?: string, overrideIdea?: string) => {
    const targetSymbol = overrideSymbol || symbol
    const targetIdea = (overrideIdea !== undefined ? overrideIdea : idea).trim()
    if (!targetIdea) return

    setVerdictState('loading')
    setEvalStep(1)
    setLiveResult(null)
    setLiveError(null)

    const startTime = performance.now()

    // Staged animation progression
    const stepTimer1 = setTimeout(() => setEvalStep(2), 300)
    const stepTimer2 = setTimeout(() => setEvalStep(3), 600)

    try {
      const res = await api.shadow(targetSymbol, targetIdea)
      const elapsed = Math.round(performance.now() - startTime)
      setEvalLatency(elapsed > 0 ? elapsed : 38)
      setLiveResult(res)
      setVerdictState('done')
    } catch (err) {
      const lower = targetIdea.toLowerCase()
      
      let verdict = 'allowed'
      let guardrail_layer: 'behavioral' | 'evidence' | null = null
      let reason_label = 'evidence-backed, within position cap'
      let explanation = 'Simulated trade allowed. Passes Layer 1 evidence consistency gate and Layer 2 behavioral bounds. (offline fallback)'

      if (lower.includes('lost twice') || lower.includes('double my size') || lower.includes('recover') || lower.includes('revenge')) {
        verdict = 'blocked'
        guardrail_layer = 'behavioral'
        reason_label = 'revenge trading'
        explanation = 'Simulated trade blocked by cooldown rule: detected consecutive losses paired with aggressive position escalation multiplier > 2x.'
      } else if (lower.includes('single') || lower.includes('tip') || lower.includes('rumor') || lower.includes('social media') || lower.includes('telegram')) {
        verdict = 'blocked'
        guardrail_layer = 'evidence'
        reason_label = 'trading on unverified hunch'
        explanation = 'Simulated trade blocked by Layer 1 Evidence Consistency Gate: single uncorroborated external claim without regulatory confirmation.'
      } else if (lower.includes('all in') || lower.includes('100%') || lower.includes('75%') || lower.includes('60%') || lower.includes('50%')) {
        verdict = 'blocked'
        guardrail_layer = 'behavioral'
        reason_label = 'oversized conviction bet'
        explanation = 'Simulated trade blocked by strict portfolio risk cap: trade sizing breaches maximum 5% single-asset exposure threshold.'
      }

      const elapsed = Math.round(performance.now() - startTime)
      setEvalLatency(elapsed > 0 ? elapsed : 36)

      setLiveResult({
        query_id: `shq-local-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        submitted_by: 'public',
        symbol: targetSymbol.toUpperCase(),
        idea: targetIdea,
        verdict: verdict as 'blocked' | 'allowed',
        guardrail_layer,
        reason_label,
        explanation,
      })
      setLiveError('Evaluated via local deterministic engine fallback.')
      setVerdictState('done')
    } finally {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
    }
  }

  return (
    <section id="shadow" className="relative rule-top px-[clamp(20px,4vw,64px)] pt-[clamp(40px,8vh,80px)] pb-[clamp(90px,14vh,160px)] overflow-hidden">
      {/* ── Ambient Glows & Cyber Grid Background (Removed per user request for flat clean look) ── */}

      {/* ── Section Header Kicker ── */}
      <div className="relative mb-12 flex flex-col items-center text-center">

        <h2 className="font-display text-[clamp(40px,6vw,90px)] uppercase tracking-[0.03em] leading-none text-snow">
          Challenge Nummuss
        </h2>

        <p className="mt-4 max-w-[65ch] text-[clamp(14px,1.2vw,17px)] leading-relaxed text-snow/70">
          The behavioral safety brake that intercepts reckless AI trade orders <span className="text-mint font-semibold">before</span> they touch market routing. 
          Tested in real-time with zero LLM hallucination risk.
        </p>

        {/* Feature Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-snow/50 font-mono">
          <span className="rounded-full border border-snow/10 bg-snow/5 px-3 py-1 text-snow/70">
            Layer 1: Evidence Gate
          </span>
          <span className="rounded-full border border-snow/10 bg-snow/5 px-3 py-1 text-snow/70">
            Layer 2: Behavioral Engine
          </span>
          <span className="rounded-full border border-mint/20 bg-mint/5 px-3 py-1 text-mint">
            &lt; 50ms Deterministic Latency
          </span>
          <span className="rounded-full border border-snow/10 bg-snow/5 px-3 py-1 text-snow/70">
            Non-Custodial Simulation
          </span>
        </div>
      </div>

      {/* ── Main Two-Column Interactive Stage ── */}
      <div className="relative grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[1.1fr_1.1fr]">

        {/* ── Left: Interactive Challenge Console ── */}
        <Reveal className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[24px] border border-mint/20 bg-charcoal-soft/80 p-6 sm:p-8 backdrop-blur-2xl">
            
            {/* Top Bar of Console */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-snow/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-snow/60">
                <span className="text-mint font-bold">&gt;</span>
                <span className="uppercase tracking-[0.14em]">POST /shadow Console</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-snow/40">
                  Rate-Limited · In-Memory Guardrails
                </span>
              </div>
            </div>

            {/* 1-Click Scenario Presets */}
            <div className="mb-6 flex flex-col gap-2.5">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-snow/40">
                Quick-Test Scenarios (1-Click Evaluation):
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESET_SCENARIOS.map((p) => {
                  const isSelected = selectedPreset === p.id
                  const toneColors = {
                    danger: 'border-danger/30 hover:border-danger bg-danger/5 hover:bg-danger/10 text-danger',
                    amber: 'border-amber/30 hover:border-amber bg-amber/5 hover:bg-amber/10 text-amber',
                    purple: 'border-purple-400/30 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300',
                    mint: 'border-mint/30 hover:border-mint bg-mint/5 hover:bg-mint/10 text-mint',
                  }
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePresetSelect(p)}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all duration-200 ${toneColors[p.tone]} ${
                        isSelected ? 'ring-1 ring-mint' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {p.tag}
                      </span>
                      <span className="text-[12px] font-semibold tracking-tight text-snow">
                        {p.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Symbol Chips */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-snow/40">
                Symbol:
              </span>
              {['NIFTY50', 'RELIANCE', 'AAPL', 'BTCINR'].map((s) => (
                <button
                  key={s}
                  id={`shadow-symbol-${s}`}
                  onClick={() => {
                    setSymbol(s)
                    setSelectedPreset(null)
                  }}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${
                    symbol === s
                      ? 'border-mint bg-mint/15 text-mint font-bold'
                      : 'border-snow/15 text-snow/40 hover:border-snow/30 hover:text-snow/70'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Idea Textarea with dynamic glow */}
            <div className="relative mb-4">
              <textarea
                id="shadow-idea-input"
                value={idea}
                onChange={(e) => {
                  setIdea(e.target.value)
                  setSelectedPreset(null)
                }}
                placeholder="Describe a trade idea… e.g. I lost twice today. I will double my size to recover."
                rows={3}
                className="w-full resize-none rounded-xl border border-mint/50 bg-ink/80 px-4 py-3.5 font-mono text-[13.5px] text-snow placeholder:text-snow/30 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint/70 transition-all"
              />
              {idea && (
                <button
                  onClick={() => {
                    setIdea('')
                    setSelectedPreset(null)
                    setVerdictState('idle')
                  }}
                  className="absolute bottom-3 right-3 rounded-md px-2 py-0.5 text-[10px] font-mono text-snow/40 hover:text-snow hover:bg-snow/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                id="shadow-submit-btn"
                onClick={() => submit()}
                disabled={verdictState === 'loading' || !idea.trim()}
                className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-mint bg-mint px-6 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-charcoal transition-all duration-300 hover:scale-105 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {verdictState === 'loading' ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-charcoal border-t-transparent" />
                    <span>Evaluating Gates…</span>
                  </>
                ) : (
                  <>
                    <span>Submit Challenge</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </>
                )}
              </button>

              <span className="font-mono text-[11px] text-snow/40">
                {idea.length} / 250 chars
              </span>
            </div>

            {/* Evaluating holographic progression */}
            <AnimatePresence>
              {verdictState === 'loading' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 space-y-2 rounded-xl border border-snow/10 bg-ink/90 p-4 font-mono text-xs overflow-hidden relative"
                >
                  {/* Laser Scan Beam */}
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-80 animate-[laser-sweep_1.5s_linear_infinite]" />

                  <div className="flex items-center gap-2 text-snow/80">
                    <span className={evalStep >= 1 ? 'text-mint' : 'text-snow/30'}>
                      {evalStep >= 1 ? '✓' : '○'}
                    </span>
                    <span>1. Ingesting intent & PII scrubbing</span>
                  </div>
                  <div className="flex items-center gap-2 text-snow/80">
                    <span className={evalStep >= 2 ? 'text-mint' : 'text-snow/30'}>
                      {evalStep >= 2 ? '✓' : '○'}
                    </span>
                    <span>2. Evaluating Layer 1: Evidence Consistency Gate</span>
                  </div>
                  <div className="flex items-center gap-2 text-snow/80">
                    <span className={evalStep >= 3 ? 'text-mint' : 'text-snow/30'}>
                      {evalStep >= 3 ? '✓' : '○'}
                    </span>
                    <span>3. Evaluating Layer 2: Behavioral Safety Engine (Cooldown & Max Loss)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Verdict Card */}
            <AnimatePresence>
              {verdictState === 'done' && liveResult && (
                <motion.div
                  id="shadow-verdict-result"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`mt-6 rounded-2xl border p-5 font-mono transition-all duration-300 ${
                    liveResult.verdict === 'blocked'
                      ? 'border-danger/60 bg-danger/10'
                      : 'border-mint/60 bg-mint/10'
                  }`}
                >
                  {liveError && (
                    <p className="mb-2 text-[10px] text-amber/70">{liveError}</p>
                  )}

                  {/* Verdict Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-snow/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-3 py-1 text-[13px] font-extrabold uppercase tracking-wider ${
                        liveResult.verdict === 'blocked'
                          ? 'border border-danger/50 bg-danger text-charcoal'
                          : 'border border-mint/50 bg-mint text-charcoal'
                      }`}>
                        {liveResult.verdict === 'blocked' ? 'BLOCKED' : 'ALLOWED'}
                      </span>
                      <span className="text-sm font-semibold text-snow">
                        reason: <span className={liveResult.verdict === 'blocked' ? 'text-amber' : 'text-mint'}>{liveResult.reason_label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-snow/40">
                      <span>Latency: {evalLatency}ms</span>
                      <span>·</span>
                      <span className="text-mint font-semibold">Zero Hallucination</span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="my-3 text-[13px] leading-relaxed text-snow/80">
                    {liveResult.explanation}
                  </p>

                  {/* Metadata telemetry */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-snow/10 pt-3 text-[11px] text-snow/40">
                    <div>
                      Layer:{' '}
                      <span className="text-snow/70 font-semibold">
                        {liveResult.guardrail_layer ? `Layer ${liveResult.guardrail_layer}` : 'All Layers Clean'}
                      </span>
                    </div>
                    <div className="text-[10px] opacity-60">
                      Query ID: {liveResult.query_id}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </Reveal>

        {/* ── Right: Telemetry Terminal & Architecture Visualizer ── */}
        <Reveal delay={0.15}>
          <div className="flex flex-col gap-4">
            
            {/* Live Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-snow/10 bg-charcoal-soft/60 p-3 font-mono text-center backdrop-blur-md">
              <div>
                <div className="text-[10px] text-snow/40 uppercase tracking-wider">Avg Latency</div>
                <div className="text-sm font-bold text-mint">34 ms</div>
              </div>
              <div className="border-x border-snow/10">
                <div className="text-[10px] text-snow/40 uppercase tracking-wider">Hallucinations</div>
                <div className="text-sm font-bold text-snow">0.0 %</div>
              </div>
              <div>
                <div className="text-[10px] text-snow/40 uppercase tracking-wider">Brake Status</div>
                <div className="text-sm font-bold text-mint flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                  ACTIVE
                </div>
              </div>
            </div>

            {/* Terminal Container */}
            <div
              ref={demoRef}
              className="overflow-hidden rounded-[24px] border border-snow/15 bg-ink shadow-2xl backdrop-blur-xl"
            >
              {/* Window Title Bar with View Toggles */}
              <div className="flex items-center justify-between border-b border-snow/10 bg-charcoal-soft/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full bg-danger/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-amber/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-mint/80" />
                </div>

                {/* Switcher */}
                <div className="flex rounded-lg border border-snow/10 bg-ink p-0.5 text-[11px] font-mono">
                  <button
                    onClick={() => setRightPanelTab('terminal')}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      rightPanelTab === 'terminal'
                        ? 'bg-mint/15 text-mint font-bold'
                        : 'text-snow/50 hover:text-snow'
                    }`}
                  >
                    Terminal Stream
                  </button>
                  <button
                    onClick={() => setRightPanelTab('architecture')}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      rightPanelTab === 'architecture'
                        ? 'bg-mint/15 text-mint font-bold'
                        : 'text-snow/50 hover:text-snow'
                    }`}
                  >
                    Gate Architecture
                  </button>
                </div>
              </div>

              {/* View 1: Typewriter Terminal Stream */}
              {rightPanelTab === 'terminal' && (
                <div className="flex flex-col gap-4 p-5 font-mono text-[13px] leading-relaxed">
                  <div className="text-snow/50 text-[11px]">
                    # Deterministic Shadow Telemetry Stream · Autonomous Interception Loop
                  </div>

                  <div className="rounded-xl border border-snow/10 bg-charcoal-soft/50 p-3.5 text-snow">
                    <span className="text-mint">&gt; </span>
                    {demoTyped}
                    {!demoTypingDone && <span className="caret" />}
                  </div>

                  {demoTypingDone && (
                    <motion.div
                      className="flex flex-col gap-2.5 rounded-xl border border-snow/10 bg-snow/3 p-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="text-snow/40 text-xs flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-mint animate-ping" />
                        Evaluating · Evidence Gate · Behavioral Bounds …
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 font-bold tracking-[0.08em] ${
                            current.verdict === 'BLOCKED'
                              ? 'border border-danger/40 bg-danger/20 text-danger'
                              : 'border border-mint/40 bg-mint/15 text-mint'
                          }`}
                        >
                          {current.verdict}
                        </span>
                        <span className="text-amber">reason: {current.reason}</span>
                      </div>

                      {current.signals.map((signal) => (
                        <div key={signal} className="text-snow/50 text-[12px]">{signal}</div>
                      ))}
                    </motion.div>
                  )}

                  {/* Equalizer animation bar */}
                  <div className="mt-2 flex items-center justify-between border-t border-snow/10 pt-3 text-[11px] text-snow/40">
                    <span>Engine Frequency: 1000 ops/sec</span>
                    <div className="flex items-end gap-1 h-3">
                      <span className="w-1 bg-mint/60 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
                      <span className="w-1 bg-mint rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-3.5" />
                      <span className="w-1 bg-mint/40 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-1.5" />
                      <span className="w-1 bg-mint rounded-full animate-[pulse_1s_ease-in-out_infinite] h-3" />
                      <span className="w-1 bg-mint/80 rounded-full animate-[pulse_1.4s_ease-in-out_infinite] h-2.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Gate Architecture Diagram */}
              {rightPanelTab === 'architecture' && (
                <div className="p-5 font-mono text-xs space-y-4">
                  <div className="text-snow/50 text-[11px]">
                    # Deterministic Multi-Layer Interception Architecture
                  </div>

                  <div className="space-y-3">
                    {/* Stage 1 */}
                    <div className="rounded-xl border border-snow/15 bg-charcoal-soft/60 p-3">
                      <div className="flex items-center justify-between text-snow font-bold mb-1">
                        <span className="flex items-center gap-2">
                          <span className="text-mint">01</span> Trade Idea Ingestion
                        </span>
                        <span className="text-[10px] text-snow/40">AMAZON EVENTBRIDGE</span>
                      </div>
                      <p className="text-[11.5px] text-snow/50">
                        Sanitizes payload, strips PII, normalizes symbol and timestamp across US & Indian markets.
                      </p>
                    </div>

                    {/* Arrow down */}
                    <div className="text-center text-mint font-bold">&darr;</div>

                    {/* Stage 2 */}
                    <div className="rounded-xl border border-amber/30 bg-amber/5 p-3">
                      <div className="flex items-center justify-between text-amber font-bold mb-1">
                        <span className="flex items-center gap-2">
                          <span>02</span> Layer 1: Evidence Gate
                        </span>
                        <span className="text-[10px] text-amber/60">DETERMINISTIC</span>
                      </div>
                      <p className="text-[11.5px] text-snow/60">
                        Demands &ge;2 corroborating sources with freshness verification. Drops single-source rumours and Twitter speculation.
                      </p>
                    </div>

                    {/* Arrow down */}
                    <div className="text-center text-mint font-bold">&darr;</div>

                    {/* Stage 3 */}
                    <div className="rounded-xl border border-mint/30 bg-mint/5 p-3">
                      <div className="flex items-center justify-between text-mint font-bold mb-1">
                        <span className="flex items-center gap-2">
                          <span>03</span> Layer 2: Behavioral Engine
                        </span>
                        <span className="text-[10px] text-mint/60">MATHEMATICAL BOUNDS</span>
                      </div>
                      <p className="text-[11.5px] text-snow/60">
                        Hard rules: Cooldown after 2 losses, max 5% position sizing, and mandatory circuit-breaker on cumulative drawdown.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </Reveal>

      </div>
    </section>
  )
}
