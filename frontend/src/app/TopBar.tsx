/** Application status is derived from the API, never fabricated client time. */

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, FeedDecision } from '../lib/api'

const pageNames: Record<string, string> = {
  '/dashboard': 'OVERVIEW', '/experiment': 'THE EXPERIMENT', '/decisions': 'DECISION LOG',
  '/counterfactual': 'COUNTERFACTUAL EVIDENCE', '/replay': 'INDIA REPLAY', '/risk': 'BEHAVIORAL RISK',
  '/security': 'SECURITY CENTER', '/shadow': 'SHADOW LAB', '/evidence': 'EVIDENCE EXPLORER', '/system': 'SYSTEM STATUS',
}

type DataStatus = 'checking' | 'live' | 'empty' | 'offline'

export function TopBar() {
  const location = useLocation()
  const [status, setStatus] = useState<DataStatus>('checking')
  const [latestDecision, setLatestDecision] = useState<FeedDecision | null>(null)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const result = await api.feed('live_paper', 'disciplined')
        if (!active) return
        setLatestDecision(result.decisions[0] ?? null)
        setStatus(result.decisions.length ? 'live' : 'empty')
      } catch {
        if (active) setStatus('offline')
      }
    }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30_000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  const pageName = location.pathname.startsWith('/decisions/') ? 'DECISION DETAIL' : pageNames[location.pathname] || 'NUMMUSS'
  const statusDisplay = {
    checking: { label: 'CHECKING DATA', tone: 'text-amber', dot: 'bg-amber' },
    live: { label: 'LIVE DATA AVAILABLE', tone: 'text-mint', dot: 'bg-mint' },
    empty: { label: 'NO LIVE DATA', tone: 'text-amber', dot: 'bg-amber' },
    offline: { label: 'API UNAVAILABLE', tone: 'text-danger', dot: 'bg-danger' },
  }[status]

  return (
    <header className="mt-4 mr-4 flex h-16 flex-shrink-0 items-center justify-between rounded-[24px] bg-[#111412] px-6">
      <h2 className="text-sm font-medium tracking-wide text-snow">{pageName}</h2>
      <div className="flex items-center gap-6 text-[10px] md:text-xs">
        <div className="flex items-center gap-2"><span className="uppercase tracking-wider text-snow/40">MODE</span><span className="font-medium text-snow/80">PAPER ONLY</span></div>
        <div className="flex items-center gap-2"><div className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dot}`} /><span className={`font-medium ${statusDisplay.tone}`}>{statusDisplay.label}</span></div>
        {latestDecision && <div className="hidden items-center gap-2 md:flex"><span className="uppercase tracking-wider text-snow/40">LAST DECISION</span><span className="font-mono tabular text-snow/80">{new Date(latestDecision.timestamp).toLocaleString()}</span></div>}
      </div>
    </header>
  )
}
