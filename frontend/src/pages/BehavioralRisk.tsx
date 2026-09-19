/**
 * Behavioral Risk Page - /risk
 * Trigger counts and behavioral patterns (NO FAKE AI SCORE)
 */

export default function BehavioralRisk() {
  const patterns: any[] = []

  const totalTriggers = patterns.reduce((sum, p) => sum + p.count, 0)

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">Behavioral Risk</h1>
        <p className="text-snow/60">Trigger counts and failure patterns (no fake AI score)</p>
      </div>

      {/* Total Triggers */}
      <div className="text-center p-8 bg-[#111412] border border-snow/10 rounded-2xl">
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-2">TOTAL BEHAVIORAL TRIGGERS</p>
        <p className="text-5xl font-mono font-bold text-snow">{totalTriggers}</p>
      </div>

      {/* Pattern Breakdown */}
      <div>
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-6">FAILURE PATTERN BREAKDOWN</p>
        <div className="space-y-4">
          {patterns.length > 0 ? (
            patterns.map((pattern) => {
              const pct = ((pattern.count / totalTriggers) * 100).toFixed(0)
              return (
                <div key={pattern.name} className="bg-[#111412] border border-snow/10 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-snow mb-1">{pattern.name}</p>
                      <p className="text-sm text-snow/60">{pattern.description}</p>
                    </div>
                    <div className="text-right ml-6">
                      <p className="text-3xl font-mono font-bold text-snow/80">{pattern.count}</p>
                      <p className="text-xs text-snow/40">{pct}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-snow/5 rounded-full overflow-hidden">
                    <div className="h-full bg-snow rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-snow/10">
                    <p className="text-sm text-snow/50">
                      <span className="font-bold text-snow">{pattern.count}</span> triggered •{' '}
                      <span className="font-bold text-snow/80">{pattern.count}</span> blocked
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-snow/40 text-sm py-4">No behavioral risk patterns detected.</div>
          )}
        </div>
      </div>

      {/* Current Evidence Quality */}
      <div>
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-6">CURRENT EVIDENCE QUALITY</p>
        <div className="grid grid-cols-3 gap-6">
          {['WEAK', 'MEDIUM', 'STRONG'].map((quality) => (
            <div key={quality} className="p-6 rounded-xl border border-snow/10 bg-[#111412]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  quality === 'STRONG' ? 'bg-mint' :
                  quality === 'MEDIUM' ? 'bg-snow/50' :
                  'bg-danger'
                }`} />
                <p className="text-xl font-bold text-snow">
                  {quality}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
