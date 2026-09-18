/**
 * Decisions Page - /decisions
 * Browse every system decision with filters
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeed } from '../lib/useApi'

type FilterAction = 'all' | 'buy' | 'sell' | 'hold' | 'blocked'
type FilterAgent = 'disciplined' | 'twin'

export default function Decisions() {
  const [actionFilter, setActionFilter] = useState<FilterAction>('all')
  const [agentFilter, setAgentFilter] = useState<FilterAgent>('disciplined')

  const { data: decisions, loading } = useFeed('india_replay', agentFilter)

  const filteredDecisions = decisions.filter((d) => {
    if (actionFilter === 'blocked') return d.guardrail_result === 'blocked'
    if (actionFilter === 'all') return true
    return d.action === actionFilter
  })

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display text-snow mb-2">Decision Log</h1>
        <p className="text-snow/60">Forensic feed of all system decisions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Action Filter */}
        <div className="flex gap-2">
          {(['all', 'buy', 'sell', 'hold', 'blocked'] as FilterAction[]).map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide transition-colors ${
                actionFilter === action
                  ? 'bg-amber text-charcoal'
                  : 'bg-[#111412] text-snow/60 hover:text-snow border border-snow/10'
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Agent Filter */}
        <div className="flex gap-2 ml-auto">
          {(['disciplined', 'twin'] as FilterAgent[]).map((agent) => (
            <button
              key={agent}
              onClick={() => setAgentFilter(agent)}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide transition-colors ${
                agentFilter === agent
                  ? agent === 'disciplined'
                    ? 'bg-mint text-charcoal'
                    : 'bg-danger text-charcoal'
                  : 'bg-[#111412] text-snow/60 hover:text-snow border border-snow/10'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>
      </div>

      {/* Decision List */}
      {loading ? (
        <div className="text-center py-12 text-snow/40">Loading decisions...</div>
      ) : (
        <div className="space-y-3">
          {filteredDecisions.map((decision) => {
            const isBlocked = decision.guardrail_result === 'blocked'
            const actionColor =
              decision.action === 'buy' ? 'text-mint' : decision.action === 'sell' ? 'text-danger' : 'text-amber'

            return (
              <Link
                key={decision.decision_id}
                to={`/decisions/${decision.decision_id}`}
                className="block bg-[#111412] border border-snow/10 hover:border-snow/20 rounded-xl p-6 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Symbol + Action */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#060807] border border-snow/10 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-snow/80">{decision.symbol.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-snow">{decision.symbol}</p>
                      <p className={`text-sm font-semibold uppercase tracking-wide ${actionColor}`}>
                        {decision.action}
                        {isBlocked && <span className="ml-2 text-xs text-danger/70">[BLOCKED]</span>}
                      </p>
                    </div>
                  </div>

                  {/* Center: Context + Evidence */}
                  <div className="flex-1 hidden md:block">
                    <p className="text-sm text-snow/60">{decision.market_context}</p>
                    <p className="text-xs text-snow/40 mt-1">
                      Evidence: <span className="capitalize">{decision.evidence_quality}</span> •{' '}
                      Confidence: <span className="capitalize">{decision.confidence_tier}</span>
                    </p>
                  </div>

                  {/* Right: Time + Layer */}
                  <div className="text-right">
                    <p className="text-xs text-snow/40 font-mono">
                      {new Date(decision.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {decision.guardrail_layer && (
                      <p className="text-xs text-amber font-mono mt-1">{decision.guardrail_layer}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Results count */}
      <div className="text-center pt-4">
        <p className="text-sm text-snow/40">
          Showing {filteredDecisions.length} of {decisions.length} decisions
        </p>
      </div>
    </div>
  )
}
