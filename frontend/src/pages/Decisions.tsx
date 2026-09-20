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

  const { data: decisions, loading } = useFeed('live_paper', agentFilter)

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
                  ? 'bg-snow text-charcoal'
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
                  ? 'bg-snow/10 text-snow border border-snow/20'
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
      ) : filteredDecisions.length > 0 ? (
        <div className="space-y-3">
          {filteredDecisions.map((decision) => {
            const isBlocked = decision.guardrail_result === 'blocked'
            const actionColor =
              decision.action === 'buy' ? 'bg-mint' : decision.action === 'sell' ? 'bg-danger' : 'bg-snow/40'

            return (
              <Link
                key={decision.decision_id}
                to={`/decisions/${decision.decision_id}`}
                className="block bg-[#111412] border border-snow/10 hover:border-snow/20 rounded-xl p-6 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Symbol + Action */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-snow/5 border border-snow/10 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-snow/80">{decision.symbol.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p className="text-base font-mono font-bold text-snow">{decision.symbol}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${actionColor}`} />
                        <p className="text-xs font-semibold uppercase tracking-wide text-snow/80">
                          {decision.action}
                        </p>
                        {isBlocked && (
                          <span className="ml-1 text-[10px] uppercase border border-snow/20 px-1.5 py-0.5 rounded text-snow/60 font-medium">
                            BLOCKED
                          </span>
                        )}
                      </div>
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
                      <p className="text-xs text-snow/80 font-mono mt-1">{decision.guardrail_layer}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8 text-center text-snow/40 h-64 flex items-center justify-center">
          No decisions found for the selected filters
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
