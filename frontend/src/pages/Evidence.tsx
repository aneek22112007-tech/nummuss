/**
 * Evidence Page - /evidence
 * Audit explorer with source relationships
 */

export default function Evidence() {
  const sources = Array.from({ length: 8 }, (_, i) => ({
    id: `sig-${1000 + i}`,
    timestamp: new Date(Date.now() - i * 7200000).toISOString(),
    symbol: ['BTCINR', 'ETHINR', 'SOLUSD'][i % 3],
    headline: ['Technical momentum shift detected', 'Volume surge on support level', 'Order book imbalance'][i % 3],
    freshness: ['Fresh', 'Recent', 'Stale'][i % 3],
    corroboration: ['3 sources', '2 sources', '1 source'][i % 3],
  }))

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">Evidence Explorer</h1>
        <p className="text-snow/60">Audit trail showing evidence → decision → safety result</p>
      </div>

      {/* Source List */}
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="bg-[#111412] border border-snow/10 rounded-xl p-6 hover:border-snow/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-mono text-amber">{source.id}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    source.freshness === 'Fresh' ? 'bg-mint/10 text-mint' :
                    source.freshness === 'Recent' ? 'bg-amber/10 text-amber' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {source.freshness}
                  </span>
                </div>
                <p className="text-sm font-bold text-snow mb-1">{source.symbol}</p>
                <p className="text-sm text-snow/70">{source.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-snow/40 mb-1">
                  {new Date(source.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-snow/50">{source.corroboration}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Relationship Flow */}
      <div className="bg-[#060807] border border-snow/10 rounded-2xl p-8">
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-6">EVIDENCE FLOW</p>
        <div className="flex items-center justify-center gap-6">
          <FlowBox label="EVIDENCE" sublabel="Multi-source" />
          <FlowArrow />
          <FlowBox label="DECISION" sublabel="Analyzed" />
          <FlowArrow />
          <FlowBox label="SAFETY" sublabel="Verified" />
        </div>
      </div>
    </div>
  )
}

function FlowBox({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6 text-center min-w-[140px]">
      <p className="text-sm font-bold text-snow uppercase tracking-wide">{label}</p>
      <p className="text-xs text-snow/50 mt-1">{sublabel}</p>
    </div>
  )
}

function FlowArrow() {
  return (
    <svg className="w-6 h-6 text-snow/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
