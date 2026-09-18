import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { api } from '../lib/api'
import type { ShadowResponse } from '../lib/api'
import { shadow, shadowExchanges } from '../data/content'

type VerdictState = 'idle' | 'loading' | 'done'

/**
 * Shadow Challenge section — POST /shadow for live deterministic verdicts.
 * Demo exchanges loop via the original typing animation.
 * Users can also submit their own trade idea via the live form.
 */
export function Shadow() {
  /* ── canned demo ── */
  const [demoTyped, setDemoTyped] = useState('')
  const [exchangeIndex, setExchangeIndex] = useState(0)
  const demoRef = useRef<HTMLDivElement>(null)
  const [demoInView, setDemoInView] = useState(false)

  const current = shadowExchanges[exchangeIndex]
  const demoTypingDone = demoTyped.length >= current.request.length

  // IntersectionObserver for demo terminal
  useEffect(() => {
    const el = demoRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDemoInView(true) },
      { threshold: 0.3 },
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
      4200,
    )
    return () => window.clearTimeout(id)
  }, [demoTypingDone])

  /* ── live challenge form ── */
  const [symbol, setSymbol] = useState('NIFTY50')
  const [idea, setIdea] = useState('')
  const [verdictState, setVerdictState] = useState<VerdictState>('idle')
  const [liveResult, setLiveResult] = useState<ShadowResponse | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)

  const submit = async () => {
    if (!idea.trim()) return
    setVerdictState('loading')
    setLiveResult(null)
    setLiveError(null)
    try {
      const res = await api.shadow(symbol, idea)
      setLiveResult(res)
      setVerdictState('done')
    } catch (err) {
      // Graceful deterministic fallback from keyword matching
      const lower = idea.toLowerCase()
      const isBlocked =
        lower.includes('lost twice') || lower.includes('double my size') ||
        lower.includes('revenge') || lower.includes('tip') || lower.includes('all in')

      setLiveResult({
        query_id: `shq-local-${Date.now()}`,
        timestamp: new Date().toISOString(),
        submitted_by: 'public',
        symbol: symbol.toUpperCase(),
        idea,
        verdict: isBlocked ? 'blocked' : 'allowed',
        guardrail_layer: isBlocked ? 'behavioral' : null,
        reason_label: isBlocked ? 'revenge trading / hunch' : 'evidence-backed, within position cap',
        explanation: isBlocked
          ? 'Blocked by behavioral engine (offline fallback).'
          : 'Allowed — passes simulated Layer 1 & 2 checks (offline fallback).',
      })
      setLiveError('API unreachable — verdict computed locally.')
      setVerdictState('done')
    }
  }

  return (
    <section id="shadow" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <div className="grid items-start gap-[clamp(28px,5vw,72px)] lg:grid-cols-[1fr_1.1fr]">

        {/* ── Left: copy + live challenge form ── */}
        <Reveal className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <BracketLabel>{shadow.label}</BracketLabel>
            <SplitHeading className="text-[clamp(34px,5vw,72px)]" lines={shadow.headingLines} />
            <p className="max-w-[52ch] text-snow/60">{shadow.lead}</p>
            <p className="border-l-2 border-mint pl-3.5 text-[13px] text-snow/40">{shadow.note}</p>
          </div>

          {/* Live submission form */}
          <div className="flex flex-col gap-3 rounded-[16px] border border-snow/10 bg-snow/3 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-snow/35">Try it live — POST /shadow</p>

            <div className="flex gap-2">
              {['NIFTY50', 'AAPL', 'RELIANCE'].map((s) => (
                <button
                  key={s}
                  id={`shadow-symbol-${s}`}
                  onClick={() => setSymbol(s)}
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.1em] transition-colors ${
                    symbol === s
                      ? 'border-mint bg-mint/12 text-mint'
                      : 'border-snow/15 text-snow/40 hover:border-snow/30 hover:text-snow/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <textarea
              id="shadow-idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your trade idea… e.g. I lost twice today. I will double my size to recover."
              rows={3}
              className="w-full resize-none rounded-[10px] border border-snow/10 bg-ink px-4 py-3 text-[13.5px] text-snow placeholder:text-snow/25 focus:outline-none focus:border-mint/40 transition-colors"
            />

            <button
              id="shadow-submit-btn"
              onClick={submit}
              disabled={verdictState === 'loading' || !idea.trim()}
              className="self-start rounded-full border border-mint/40 bg-mint/10 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-mint transition-all hover:bg-mint/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {verdictState === 'loading' ? 'Evaluating…' : 'Submit Challenge'}
            </button>

            {/* Live verdict result */}
            <AnimatePresence>
              {verdictState === 'done' && liveResult && (
                <motion.div
                  id="shadow-verdict-result"
                  className="flex flex-col gap-2 rounded-[10px] border border-snow/10 bg-ink px-4 py-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {liveError && (
                    <p className="text-[10px] text-amber/60">{liveError}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md border px-2.5 py-0.5 font-mono text-[12px] font-bold tracking-[0.08em] uppercase ${
                      liveResult.verdict === 'blocked'
                        ? 'border-danger/40 bg-danger/15 text-danger'
                        : 'border-mint/40 bg-mint/12 text-mint'
                    }`}>
                      {liveResult.verdict}
                    </span>
                    <span className="text-[13px] text-amber">reason: {liveResult.reason_label}</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-snow/50">{liveResult.explanation}</p>
                  {liveResult.guardrail_layer && (
                    <p className="font-mono text-[11px] text-snow/30">
                      layer: {liveResult.guardrail_layer} · id: {liveResult.query_id}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* ── Right: animated demo terminal ── */}
        <Reveal delay={0.15}>
          <div
            ref={demoRef}
            className="overflow-hidden rounded-[18px] border border-snow/10 bg-ink font-mono text-[13.5px]"
          >
            <div className="flex items-center gap-2 border-b border-snow/10 px-4 py-3">
              <i className="h-2.5 w-2.5 rounded-full bg-danger" />
              <i className="h-2.5 w-2.5 rounded-full bg-amber" />
              <i className="h-2.5 w-2.5 rounded-full bg-mint" />
              <span className="ml-auto text-[11px] tracking-[0.1em] text-snow/40">
                POST /shadow · rate-limited
              </span>
            </div>

            <div className="flex flex-col gap-3 px-5 py-5 leading-relaxed">
              <div className="text-snow">
                <span className="text-mint">&#10142; </span>
                {demoTyped}
                {!demoTypingDone && <span className="caret" />}
              </div>

              {demoTypingDone && (
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-snow/40">
                    &rarr; evaluating · evidence gate · behavioral engine &hellip;
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-md px-2.5 py-0.75 font-bold tracking-[0.08em] ${
                        current.verdict === 'BLOCKED'
                          ? 'border border-danger/40 bg-danger/15 text-danger'
                          : 'border border-mint/40 bg-mint/12 text-mint'
                      }`}
                    >
                      {current.verdict}
                    </span>
                    <span className="ml-3 text-amber">reason: {current.reason}</span>
                  </div>
                  {current.signals.map((signal) => (
                    <div key={signal} className="text-snow/40">{signal}</div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
