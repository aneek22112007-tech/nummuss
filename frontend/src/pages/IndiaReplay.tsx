/**
 * India Replay Page - /replay
 * Historical Indian market scenarios with timelines
 */

export default function IndiaReplay() {
  const scenarios: any[] = []

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">India Replay</h1>
        <div className="flex gap-4 items-center">
          <span className="px-3 py-1 bg-snow/5 border border-snow/10 rounded-lg text-xs font-bold text-snow/80 uppercase tracking-wide">SIMULATED</span>
          <span className="px-3 py-1 bg-snow/5 border border-snow/10 rounded-lg text-xs font-bold text-snow/60 uppercase tracking-wide flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-danger" />
            NO NSE ORDER
          </span>
        </div>
        <p className="text-snow/60 mt-4">Starting capital: <span className="font-mono font-bold">₹1,00,000</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.length > 0 ? (
          scenarios.map((s) => (
            <div key={s.id} className="bg-[#111412] border border-snow/10 rounded-2xl p-6 hover:border-snow/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-snow/40 uppercase tracking-widest">SCENARIO {s.id}</p>
                <p className="text-xs text-snow/50 font-mono">{s.date}</p>
              </div>
              <h3 className="text-base font-bold text-snow mb-6">{s.title}</h3>
              <div className="pt-4 border-t border-snow/10 flex items-center justify-between">
                <p className="text-xs text-snow/40 uppercase tracking-widest">Capital diff</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-mint" />
                  <p className="text-lg font-mono font-bold text-snow">{s.diff}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-snow/40 text-sm py-4 h-32 flex items-center justify-center border border-snow/10 rounded-2xl bg-[#111412]">No simulated scenarios available.</div>
        )}
      </div>
    </div>
  )
}
