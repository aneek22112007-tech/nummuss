/** A user-owned, bounded paper-trading agent. */

import { useCallback, useEffect, useState } from 'react'
import { api, PaperPerformance, ShadowAgent, ShadowPerformanceResponse } from '../lib/api'
import { useShadow } from '../lib/useApi'
import { useAuth } from '../lib/auth'

const POLL_INTERVAL_MS = 10_000

function money(value?: number) {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function PortfolioCard({ label, value, accent = 'text-snow' }: { label: string; value?: Partial<PaperPerformance>; accent?: string }) {
  const hasPerformance = typeof value?.current_value_inr === 'number'
  const pnl = value?.pnl_inr
  return (
    <div className="rounded-xl border border-snow/10 bg-[#0a0d0b] p-5">
      <p className="text-xs uppercase tracking-widest text-snow/45">{label}</p>
      <p className={`mt-2 text-2xl font-mono font-bold ${accent}`}>{money(value?.current_value_inr)}</p>
      {hasPerformance ? <><p className={`mt-1 font-mono text-sm ${(pnl ?? 0) > 0 ? 'text-mint' : (pnl ?? 0) < 0 ? 'text-danger' : 'text-snow/50'}`}>{(pnl ?? 0) >= 0 ? '+' : ''}{money(pnl)} P&L · {value?.trades_taken ?? 0} paper trades</p><p className="mt-3 text-xs text-snow/40">Last action: {(value?.last_action ?? 'hold').toUpperCase()}</p></> : <p className="mt-3 text-sm text-snow/45">Awaiting the first live decision.</p>}
    </div>
  )
}

export default function ShadowLab() {
  const { user, isLoading: authLoading } = useAuth()
  const { createAgent, loading: creating } = useShadow()
  const [symbol, setSymbol] = useState('')
  const [idea, setIdea] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [agent, setAgent] = useState<ShadowAgent | null>(null)
  const [performance, setPerformance] = useState<ShadowPerformanceResponse | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const active = await api.activeShadow(user.id)
      setAgent(active.agent)
      if (active.agent) setPerformance(await api.shadowPerformance(active.agent.agent_id, user.id))
      else setPerformance(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load your Shadow Agent.')
    } finally {
      setLoadingAgent(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!agent || !user) return
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [agent, refresh, user])

  const submit = async () => {
    if (!user) return
    setMessage(null)
    const result = await createAgent(user.id, symbol.trim(), idea.trim(), durationDays)
    if (!result) {
      setMessage('The strategy was not started. Add a concrete action and when it should happen, then try again.')
      return
    }
    setAgent(result.agent)
    setPerformance({ agent: result.agent, benchmarks: {} as ShadowPerformanceResponse['benchmarks'] })
  }

  if (authLoading || loadingAgent) return <div className="p-8 text-snow/60">Loading Shadow Lab…</div>

  if (!user) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-4xl text-snow">Shadow Lab</h1>
        <p className="mt-4 text-snow/65">Sign in from the home page to create and track your own paper-trading agent.</p>
      </div>
    )
  }

  if (agent) {
    return (
      <div className="mx-auto max-w-5xl space-y-7 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-mint">Active paper agent</p>
            <h1 className="mt-2 font-display text-4xl text-snow">Your Shadow Agent</h1>
            <p className="mt-2 max-w-2xl text-snow/60">{agent.symbol} · ends {new Date(agent.end_time).toLocaleString()} · updates after each market-signal cycle.</p>
          </div>
          <span className="rounded-full border border-mint/40 bg-mint/10 px-4 py-2 font-mono text-sm text-mint">PAPER ONLY</span>
        </div>
        <div className="rounded-2xl border border-snow/10 bg-[#111412] p-6">
          <p className="text-xs uppercase tracking-widest text-snow/40">Your instruction</p>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-snow/85">{agent.behavior_prompt}</p>
          <p className="mt-4 text-sm text-snow/50">Safety and evidence checks still apply. This agent never sends brokerage orders.</p>
        </div>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl text-snow">Performance comparison</h2><button onClick={() => void refresh()} className="text-sm text-snow/55 hover:text-snow">Refresh</button></div>
          <div className="grid gap-4 md:grid-cols-3">
            <PortfolioCard label="Your Shadow" value={performance?.agent.performance ?? agent.performance} accent="text-mint" />
            <PortfolioCard label="Disciplined agent" value={performance?.benchmarks.disciplined} />
            <PortfolioCard label="Undisciplined twin" value={performance?.benchmarks.undisciplined} accent="text-amber" />
          </div>
        </section>
        {message && <p className="text-sm text-amber">{message}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 p-8">
      <div><p className="text-xs uppercase tracking-[0.18em] text-mint">Custom paper agent</p><h1 className="mt-2 font-display text-4xl text-snow">Create your Shadow Agent</h1><p className="mt-3 max-w-2xl text-snow/65">Describe the action and its trigger. We check that the instruction is clear and safe—not whether it will be profitable. You can run one agent for 1–30 days.</p></div>
      <div className="space-y-5 rounded-2xl border border-snow/10 bg-[#111412] p-7">
        <label className="block text-sm text-snow/70">Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} maxLength={32} placeholder="Enter the market symbol" className="mt-2 w-full rounded-lg border border-snow/10 bg-[#060807] px-4 py-3 font-mono text-snow outline-none focus:border-mint/50" /></label>
        <label className="block text-sm text-snow/70">Trading behaviour<textarea value={idea} onChange={(event) => setIdea(event.target.value)} maxLength={4000} rows={6} placeholder="Describe an action and the condition that should trigger it." className="mt-2 w-full resize-none rounded-lg border border-snow/10 bg-[#060807] px-4 py-3 text-snow outline-none focus:border-mint/50" /></label>
        <label className="block text-sm text-snow/70">Duration: <span className="font-mono text-mint">{durationDays} days</span><input type="range" min="1" max="30" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className="mt-3 block w-full" /></label>
        {message && <p className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber">{message}</p>}
        <button onClick={() => void submit()} disabled={creating || !symbol.trim() || !idea.trim()} className="w-full rounded-lg bg-snow px-6 py-4 text-sm font-bold uppercase tracking-wide text-charcoal disabled:cursor-not-allowed disabled:opacity-50">{creating ? 'Checking your instruction…' : 'Start paper agent'}</button>
      </div>
    </div>
  )
}
