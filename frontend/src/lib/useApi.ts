import { useState, useEffect, useRef } from 'react'

type State<T> = { data: T | null; loading: boolean; error: string | null }

/**
 * Generic data-fetching hook.
 * - Calls `fetcher()` once on mount (re-calls if `key` changes).
 * - Falls back to `fallback` if the request throws or the API base is unset.
 * - Exposes `refetch()` for manual re-invocation.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  key?: string,
): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  const counter = useRef(0)

  const run = () => {
    const id = ++counter.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher()
      .then((data) => {
        if (id === counter.current) setState({ data, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (id === counter.current) {
          console.warn('[useApi] falling back to mock data:', err.message)
          setState({ data: fallback, loading: false, error: err.message })
        }
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, [key])

  return { ...state, refetch: run }
}
