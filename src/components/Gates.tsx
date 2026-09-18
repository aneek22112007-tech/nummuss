import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { safetyGates } from '../data/content'

/** L0 / L1 / L2 — the three deterministic gates every decision passes. */
export function Gates() {
  return (
    <section
      id="gates"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>Safety Layers</BracketLabel>
        <SplitHeading
          className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]"
          lines={['Every Decision', 'Passes Three Gates']}
        />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">
          AWS-managed content safety, application-owned deterministic evidence validation, and
          behavioral trading-discipline rules — before anything executes.
        </p>
      </div>

      <div className="grid gap-4.5 md:grid-cols-3">
        {safetyGates.map((gate, index) => (
          <Reveal key={gate.title} delay={index * 0.08} className="h-full">
            <article className="group relative flex h-full min-h-[340px] flex-col gap-3.5 overflow-hidden rounded-[22px] border border-snow/10 p-7 transition-[border-color,transform] duration-400 hover:-translate-y-1 hover:border-snow/25">
              <span
                className="pointer-events-none absolute -inset-x-[30%] -bottom-[60%] h-[70%] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(2,250,106,0.12), transparent)',
                }}
              />
              <span className="text-[11px] uppercase tracking-[0.2em] text-mint">
                {gate.layer}
              </span>
              <h3 className="font-display text-[clamp(24px,2.4vw,34px)] uppercase leading-none">
                {gate.title}
              </h3>
              <p className="text-[15px] text-snow/60">{gate.body}</p>
              <ul className="mt-auto flex flex-col gap-2">
                {gate.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-baseline gap-2.5 text-[13px] text-snow/60"
                  >
                    <span className="text-mint">&rarr;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
