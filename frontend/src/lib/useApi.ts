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
        setData([])
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
        setData(null)
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
        setData(null)
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
        setData(null)
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
        setData(null)
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
      return null
    } finally {
      setLoading(false)
    }
  }

  return { testIdea, loading, error }
}
