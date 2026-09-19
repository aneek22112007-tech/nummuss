/**
 * NUMMUSS Top Application Bar
 * Shows current page, mode, and cycle information
 */

import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const pageNames: Record<string, string> = {
  '/dashboard': 'OVERVIEW',
  '/experiment': 'THE EXPERIMENT',
  '/decisions': 'DECISION LOG',
  '/counterfactual': 'COUNTERFACTUAL EVIDENCE',
  '/replay': 'INDIA REPLAY',
  '/risk': 'BEHAVIORAL RISK',
  '/security': 'SECURITY CENTER',
  '/shadow': 'SHADOW LAB',
  '/evidence': 'EVIDENCE EXPLORER',
  '/system': 'SYSTEM STATUS',
}

export function TopBar() {
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Get page name, handle decision detail routes
  const pageName = location.pathname.startsWith('/decisions/')
    ? 'DECISION DETAIL'
    : pageNames[location.pathname] || 'NUMMUSS'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <header className="h-16 bg-[#111412] border-b border-snow/10 flex items-center justify-between px-6">
      {/* Current Page */}
      <div>
        <h2 className="text-sm font-medium text-snow tracking-wide">{pageName}</h2>
      </div>

      {/* System Info */}
      <div className="flex items-center gap-6 text-[10px] md:text-xs">
        {/* Mode */}
        <div className="flex items-center gap-2">
          <span className="text-snow/40 uppercase tracking-wider">MODE</span>
          <span className="text-snow/80 font-medium">LIVE PAPER / INDIA REPLAY</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          <span className="text-mint font-medium">SYSTEM OPERATIONAL</span>
        </div>

        {/* Cycle */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-snow/40 uppercase tracking-wider">LAST CYCLE</span>
            <span className="text-snow/80 font-mono tabular">{formatTime(new Date(currentTime.getTime() - 5000))}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-snow/40 uppercase tracking-wider">NEXT CYCLE</span>
            <span className="text-snow/80 font-mono tabular">{formatTime(new Date(currentTime.getTime() + 5000))}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
