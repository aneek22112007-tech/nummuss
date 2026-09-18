/**
 * API Hooks for NUMMUSS Product Application
 * Reusable hooks with fallback seed data
 */

import { useEffect, useState } from 'react'
import { api, FeedDecision, TwinResponse, CounterfactualResponse, ReplayScenarioResponse, ShadowResponse } from './api'

export function useFeed(mode = 'india_replay', agent = 'disciplined') {
  const [data, setData] = useState<FeedDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .feed(mode, agent)
      .then((res) => setData(res.decisions))
      .catch((err) => {
        setError(err)
        // Fallback seed data
        setData(generateSeedDecisions(12))
      })
      .finally(() => setLoading(false))
  }, [mode, agent])

  return { data, loading, error }
}

export function useDecision(id: string) {
  const [data, setData] = useState<FeedDecision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    api
      .decision(id)
      .then(setData)
      .catch((err) => {
        setError(err)
        // Fallback seed data
        setData(generateSeedDecisions(1)[0])
      })
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}

export function useTwin(mode = 'india_replay', days = 14) {
  const [data, setData] = useState<TwinResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .twin()
      .then(setData)
      .catch((err) => {
        setError(err)
        // Fallback seed data
        setData(generateSeedTwin(days))
      })
      .finally(() => setLoading(false))
  }, [mode, days])

  return { data, loading, error }
}

export function useCounterfactual() {
  const [data, setData] = useState<CounterfactualResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .counterfactual()
      .then(setData)
      .catch((err) => {
        setError(err)
        // Fallback seed data
        setData(generateSeedCounterfactual())
      })
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

export function useReplayScenario(id: string) {
  const [data, setData] = useState<ReplayScenarioResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    api
      .replayScenario(id)
      .then(setData)
      .catch((err) => {
        setError(err)
        // Fallback seed data
        setData(generateSeedScenario(id))
      })
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}

export function useShadow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const testIdea = async (symbol: string, idea: string): Promise<ShadowResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.shadow(symbol, idea)
      return result
    } catch (err) {
      setError(err as Error)
      // Fallback seed response
      return generateSeedShadow(symbol, idea)
    } finally {
      setLoading(false)
    }
  }

  return { testIdea, loading, error }
}

// Seed data generators
function generateSeedDecisions(count: number): FeedDecision[] {
  return Array.from({ length: count }, (_, i) => ({
    decision_id: `dec-${1000 + i}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    mode: 'india_replay',
    market_context: ['High volatility', 'Trending up', 'Sideways'][i % 3],
    agent_role: 'disciplined' as const,
    symbol: ['BTCINR', 'ETHINR', 'SOLUSD'][i % 3],
    action: (['buy', 'sell', 'hold'] as const)[i % 3],
    confidence_tier: (['low', 'medium', 'high'] as const)[i % 3],
    confidence_raw: 0.5 + Math.random() * 0.4,
    evidence_quality: (['weak', 'medium', 'strong'] as const)[i % 3],
    sources: [
      { signal_id: `sig-${i}-1`, excerpt: 'Technical indicator shows momentum shift' },
      { signal_id: `sig-${i}-2`, excerpt: 'Order book depth analysis suggests support' },
    ],
    guardrail_layer: i % 4 === 0 ? 'L1_FOMO' : i % 4 === 1 ? 'L2_OVERCONFIDENCE' : null,
    guardrail_result: i % 4 === 0 ? 'blocked' : 'allowed',
    guardrail_reason_label: i % 4 === 0 ? 'FOMO detected' : null,
    test_fixture: true,
    trade: { status: i % 4 === 0 ? 'blocked' : 'executed' },
    outcome_tracked: i % 2 === 0,
  }))
}

function generateSeedTwin(days: number): TwinResponse {
  const timeline = Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1)
    const disciplined = 100000 + 18000 * t + 2000 * Math.sin(t * 6)
    const twin = 100000 - 8000 * t + 3000 * Math.sin(t * 8) * (1 - t * 0.5)
    return {
      timestamp: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
      disciplined_inr: Math.round(disciplined),
      twin_inr: Math.round(twin),
    }
  })

  return {
    mode: 'india_replay',
    starting_capital_inr: 100000,
    timeline,
    summary: {
      disciplined_final_inr: timeline[timeline.length - 1].disciplined_inr,
      twin_final_inr: timeline[timeline.length - 1].twin_inr,
      capital_difference_inr: timeline[timeline.length - 1].disciplined_inr - timeline[timeline.length - 1].twin_inr,
    },
  }
}

function generateSeedCounterfactual(): CounterfactualResponse {
  return {
    mode: 'india_replay',
    trades_attempted: 87,
    trades_taken: { disciplined: 41, twin: 78 },
    guardrail_blocks: { disciplined: 46, twin: 9 },
    exposure_avoided_inr: 142000,
    max_drawdown: { disciplined: '-8.2%', twin: '-22.7%' },
    turnover: { disciplined: '1.8x', twin: '4.3x' },
    capital_difference_inr: 26000,
    top_blocked_behaviors: [
      { label: 'REVENGE TRADING', count: 18 },
      { label: 'OVERTRADING / FOMO', count: 14 },
      { label: 'WEAK EVIDENCE', count: 9 },
      { label: 'OVERCONFIDENCE', count: 5 },
    ],
  }
}

function generateSeedScenario(id: string): ReplayScenarioResponse {
  return {
    scenario_id: id,
    tag: 'Historical',
    title: 'Scenario ' + id,
    symbol: 'BTCINR',
    starting_capital_inr: 100000,
    description: 'Market volatility scenario',
    disciplined: {
      portfolio_value: 108000,
      max_drawdown_pct: 8.0,
      trades_taken: 3,
      turnover: '0.3x',
      blocks: 2,
    },
    twin: {
      portfolio_value: 95000,
      max_drawdown_pct: 18.0,
      trades_taken: 8,
      turnover: '1.2x',
      blocks: 0,
    },
    capital_difference_inr: 13000,
    exposure_avoided_inr: 18000,
  }
}

function generateSeedShadow(symbol: string, idea: string): ShadowResponse {
  const hasRevengeTradingSignal = idea.toLowerCase().includes('lost') || idea.toLowerCase().includes('double')
  const hasFOMOSignal = idea.toLowerCase().includes('moon') || idea.toLowerCase().includes('everyone')
  
  const verdict = hasRevengeTradingSignal || hasFOMOSignal ? 'blocked' : 'allowed'
  const layer = hasRevengeTradingSignal ? 'L1_REVENGE' : hasFOMOSignal ? 'L1_FOMO' : null
  const reason = hasRevengeTradingSignal ? 'REVENGE TRADING' : hasFOMOSignal ? 'FOMO DETECTED' : 'PASSED'

  return {
    query_id: `shadow-${Date.now()}`,
    timestamp: new Date().toISOString(),
    submitted_by: 'user',
    symbol,
    idea,
    verdict: verdict as 'blocked' | 'allowed',
    guardrail_layer: layer,
    reason_label: reason,
    explanation: hasRevengeTradingSignal
      ? 'Loss-chasing behavior detected. Position size increase after consecutive losses violates cooldown rule.'
      : hasFOMOSignal
      ? 'FOMO pattern detected. Social signal mimicry without independent evidence.'
      : 'Trade idea passed behavioral checks. Evidence quality and risk parameters acceptable.',
  }
}
