import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { useCounterfactual, useFeed } from '../lib/useApi'
import { counterfactual as content } from '../data/content'

/** Displays only data returned by the API; it never fabricates comparison data. */
export function Counterfactual() {
  const { data, loading, error } = useCounterfactual()
  const { data: decisions } = useFeed('live_paper', 'disciplined')

  return (
    <section id="counterfactual" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <div className="mb-10 flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>{content.label}</BracketLabel>
        <SplitHeading className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]" lines={['What Did', <span key="discipline" className="text-mint">Discipline</span>, 'Change?']} />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">Live comparison appears after verified market signals produce agent decisions.</p>
      </div>

      {loading ? <p className="text-snow/55">Loading live comparison…</p> : error || !data ? (
        <div className="rounded-2xl border border-snow/10 bg-charcoal-soft/20 p-8 text-snow/60">No live counterfactual data is available yet. No simulated values are displayed.</div>
      ) : (
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-snow/10 bg-charcoal-soft/20">
            <div className="grid grid-cols-[1fr_100px_100px] border-b border-snow/10 px-6 py-4 text-xs uppercase tracking-widest text-snow/45"><span>Metric</span><span className="text-right">Disciplined</span><span className="text-right">Twin</span></div>
            {[
              ['Trades attempted', data.trades_attempted, data.trades_attempted],
              ['Trades taken', data.trades_taken.disciplined, data.trades_taken.twin],
              ['Guardrail blocks', data.guardrail_blocks.disciplined, data.guardrail_blocks.twin],
              ['Exposure avoided', '—', `₹${data.exposure_avoided_inr.toLocaleString('en-IN')}`],
              ['Max drawdown', data.max_drawdown.disciplined, data.max_drawdown.twin],
            ].map(([label, disciplined, twin]) => <div key={String(label)} className="grid grid-cols-[1fr_100px_100px] border-b border-snow/5 px-6 py-4 text-sm text-snow/75"><span>{label}</span><span className="text-right font-mono">{disciplined}</span><span className="text-right font-mono">{twin}</span></div>)}
          </div>
          <p className="mt-6 text-sm text-snow/45">{decisions.length} live disciplined decisions available.</p>
        </Reveal>
      )}
    </section>
  )
}
