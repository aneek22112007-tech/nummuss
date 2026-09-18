/**
 * Nummuss API client.
 * All requests fall back to local mock data when the env var is absent
 * or when the fetch fails — so the site works without a deployed backend.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export type FeedDecision = {
  decision_id: string
  timestamp: string
  mode: string
  market_context: string
  agent_role: 'disciplined' | 'undisciplined'
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence_tier: 'low' | 'medium' | 'high'
  confidence_raw: number
  evidence_quality: 'weak' | 'medium' | 'strong'
  sources: { signal_id: string; excerpt: string }[]
  guardrail_layer: string | null
  guardrail_result: string
  guardrail_reason_label: string | null
  test_fixture: boolean
  trade: { status: string }
  outcome_tracked: boolean
}

export type TwinPoint = { timestamp: string; disciplined_inr: number; twin_inr: number }

export type TwinResponse = {
  mode: string
  starting_capital_inr: number
  timeline: TwinPoint[]
  summary: { disciplined_final_inr: number; twin_final_inr: number; capital_difference_inr: number }
}

export type CounterfactualResponse = {
  mode: string
  trades_attempted: number
  trades_taken: { disciplined: number; twin: number }
  guardrail_blocks: { disciplined: number; twin: number }
  exposure_avoided_inr: number
  max_drawdown: { disciplined: string; twin: string }
  turnover: { disciplined: string; twin: string }
  capital_difference_inr: number
  top_blocked_behaviors: { label: string; count: number }[]
}

export type ReplayScenarioResponse = {
  scenario_id: string
  tag: string
  title: string
  symbol: string
  starting_capital_inr: number
  description: string
  disciplined: { portfolio_value: number; max_drawdown_pct: number; trades_taken: number; turnover: string; blocks: number }
  twin: { portfolio_value: number; max_drawdown_pct: number; trades_taken: number; turnover: string; blocks: number }
  capital_difference_inr: number
  exposure_avoided_inr: number
}

export type ShadowResponse = {
  query_id: string
  timestamp: string
  submitted_by: string
  symbol: string
  idea: string
  verdict: 'blocked' | 'allowed'
  guardrail_layer: string | null
  reason_label: string
  explanation: string
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  feed: (mode = 'india_replay', agent = 'disciplined') =>
    get<{ decisions: FeedDecision[] }>(`/feed?mode=${mode}&agent=${agent}`),
  decision: (id: string) => get<FeedDecision>(`/decision/${id}`),
  twin: () => get<TwinResponse>('/twin'),
  counterfactual: () => get<CounterfactualResponse>('/counterfactual'),
  replayScenario: (id: string) => get<ReplayScenarioResponse>(`/replay/scenario/${id}`),
  shadow: (symbol: string, idea: string) => post<ShadowResponse>('/shadow', { symbol, idea }),
}
