/**
 * India Replay Page - /replay
 * Historical Indian market scenarios with timelines
 */

export default function IndiaReplay() {
  const scenarios = [
    { id: '01', title: 'EXPIRY-STYLE VOLATILITY', date: 'May 12, 2024', diff: '+₹6.4k' },
    { id: '02', title: 'LOSS-STREAK / RE-ENTRY', date: 'June 3, 2024', diff: '+₹2.6k' },
    { id: '03', title: 'DRAMATIC NEWS + CONTRADICTION', date: 'July 18, 2024', diff: '+₹8.3k' },
  ]

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">India Replay</h1>
        <div className="flex gap-4 items-center">
          <span className="px-3 py-1 bg-amber/10 border border-amber/30 rounded-lg text-xs font-bold text-amber uppercase">SIMULATED</span>
          <span className="px-3 py-1 bg-danger/10 border border-danger/30 rounded-lg text-xs font-bold text-danger uppercase">NO NSE ORDER</span>
        </div>
        <p className="text-snow/60 mt-4">Starting capital: <span className="font-mono font-bold">₹1,00,000</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((s) => (
          <div key={s.id} className="bg-[#111412] border border-snow/10 rounded-2xl p-6 hover:border-amber/30 transition-colors">
            <p className="text-xs text-amber mb-2">SCENARIO {s.id}</p>
            <h3 className="text-lg font-bold text-snow mb-4">{s.title}</h3>
            <p className="text-sm text-snow/50 mb-4">{s.date}</p>
            <p className="text-2xl font-mono font-bold text-mint">{s.diff}</p>
            <p className="text-xs text-snow/40 mt-1">Capital difference</p>
          </div>
        ))}
      </div>
    </div>
  )
}
