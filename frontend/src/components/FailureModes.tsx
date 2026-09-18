import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { failureModes } from '../data/content'

const badgeTones = {
  danger: 'border-danger/35 text-danger',
  amber: 'border-amber/35 text-amber',
  mint: 'border-mint/35 text-mint',
} as const

const hoverTones = {
  danger: 'hover:border-danger',
  amber: 'hover:border-amber',
  mint: 'hover:border-mint',
} as const

/** The twin's failure modes, each paired with the metric that exposes it. */
export function FailureModes() {
  return (
    <section id="modes" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>The Twin Profile</BracketLabel>
        <SplitHeading
          className="max-w-[20ch] text-[clamp(38px,6.5vw,92px)]"
          lines={['Documented Failure Modes,', 'Deliberately Unlocked']}
        />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">
          The undisciplined twin is a controlled configuration mapped to failure modes reported in
          SEBI research — not a &ldquo;bad AI,&rdquo; and not a statistical model of all retail
          traders. Same signals, same model, same code path.
        </p>
      </div>

      <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
        {failureModes.map((mode, index) => (
          <Reveal key={mode.title} delay={(index % 3) * 0.08} className="h-full">
            <article
              className={`flex h-full min-h-[250px] flex-col gap-2.5 rounded-[22px] border border-snow/10 p-6.5 transition-[transform,border-color] duration-400 hover:-translate-y-1.25 ${hoverTones[mode.tone]}`}
            >
              <span
                className={`self-start rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${badgeTones[mode.tone]}`}
              >
                {mode.badge}
              </span>
              <h3 className="font-display text-[clamp(21px,2vw,28px)] uppercase leading-none">
                {mode.title}
              </h3>
              <p className="text-[14.5px] text-snow/60">{mode.body}</p>
              <div className="mt-auto border-t border-snow/5 pt-3 text-[12px] text-snow/40">
                <b className="font-semibold text-snow">Metric: </b>
                {mode.metric}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
