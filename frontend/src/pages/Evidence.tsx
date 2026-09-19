/**
 * Evidence Page - /evidence
 * Audit explorer with source relationships
 */

export default function Evidence() {
  const sources: any[] = []

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">Evidence Explorer</h1>
        <p className="text-snow/60">Audit trail showing evidence → decision → safety result</p>
      </div>

      {/* Source List */}
      <div className="space-y-3">
        {sources.length > 0 ? (
          sources.map((source) => (
            <div key={source.id} className="bg-[#111412] border border-snow/10 rounded-xl p-6 hover:border-snow/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs font-mono text-snow/80">{source.id}</p>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-snow/10 bg-snow/5 text-[10px] font-bold uppercase text-snow/60">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        source.freshness === 'Fresh' ? 'bg-mint' :
                        source.freshness === 'Recent' ? 'bg-snow/50' :
                        'bg-danger'
                      }`} />
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
          ))
        ) : (
          <div className="text-snow/40 text-sm py-4">No evidence sources available.</div>
        )}
      </div>

    </div>
  )
}

