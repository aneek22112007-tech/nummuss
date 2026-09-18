
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { safetyGates } from '../data/content'

/* ---------- Animated mini-visuals ---------- */
function GateVisualL0() {
  return (
    <div className="relative h-[110px] overflow-hidden rounded-xl border border-snow/8 bg-ink/60 p-4 font-mono text-[11px]">
      <div className="gate-scan-line" />
      <p className="text-amber/80">INPUT  <span className="text-snow/40">→</span></p>
      <p className="mt-1 truncate text-snow/35">&quot;IGNORE PREVIOUS INSTRUCTIONS…&quot;</p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
        <p className="text-danger">CONTENT FILTER TRIGGERED</p>
      </div>
      <p className="mt-1 text-snow/30">bedrock guardrails · AWS-managed</p>
    </div>
  )
}

function GateVisualL1() {
  return (
    <div className="relative h-[110px] overflow-hidden rounded-xl border border-snow/8 bg-ink/60 p-4 font-mono text-[11px]">
      <div className="gate-scan-line" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-mint">✓</span>
          <span className="text-snow/50">ticker: NIFTY50 present in context</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-mint">✓</span>
          <span className="text-snow/50">price: traceable to signal_id</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-danger">✗</span>
          <span className="text-snow/50">sources: 1 (below floor of 2)</span>
        </div>
        <div className="flex items-center gap-2 border-t border-snow/8 pt-1.5">
          <span className="text-amber/80">→ HOLD</span>
          <span className="text-snow/30">evidence insufficient</span>
        </div>
      </div>
    </div>
  )
}

function GateVisualL2() {
  return (
    <div className="relative h-[110px] overflow-hidden rounded-xl border border-snow/8 bg-ink/60 p-4 font-mono text-[11px]">
      <div className="gate-scan-line" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-snow/30">PROPOSED:</span>
          <span className="text-snow/60">BUY 2x after 3 losses</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-danger">COOLDOWN</span>
          <span className="text-snow/40">2 losses → pause 4 cycles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-danger">POSITION CAP</span>
          <span className="text-snow/40">&gt;5% portfolio</span>
        </div>
        <div className="flex items-center gap-2 border-t border-snow/8 pt-1.5">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
          <span className="text-danger">BLOCKED · revenge trading</span>
        </div>
      </div>
    </div>
  )
}

const gateVisuals = [GateVisualL0, GateVisualL1, GateVisualL2]

/** L0 / L1 / L2 — the three deterministic gates every decision passes. */
export function Gates() {
  return (
    <section
      id="gates"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>Safety Architecture</BracketLabel>
        <SplitHeading
          className="max-w-[14ch] text-[clamp(38px,6.5vw,92px)]"
          lines={[
            'Three',
            <span key="s" className="text-mint">Safety</span>,
            'Gates.',
          ]}
        />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">
          AWS-managed content safety, application-owned deterministic evidence validation, and
          behavioral trading-discipline rules — before anything executes.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {safetyGates.map((gate, index) => {
          const Visual = gateVisuals[index]
          return (
            <Reveal key={gate.title} delay={index * 0.1} className="h-full">
              <article className="gate-card group relative flex h-full min-h-[380px] flex-col gap-4 overflow-hidden rounded-[24px] border border-snow/10 p-7 transition-[border-color,transform] duration-400 hover:-translate-y-1.5 hover:border-snow/25">
                {/* radial glow on hover */}
                <span
                  className="pointer-events-none absolute -inset-x-[30%] -bottom-[60%] h-[70%] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: 'radial-gradient(closest-side, rgba(2,250,106,0.1), transparent)',
                  }}
                />

                {/* mini visual scene */}
                {Visual && <Visual />}

                <span className="text-[11px] uppercase tracking-[0.2em] text-mint">
                  {gate.layer}
                </span>
                <h3 className="font-display text-[clamp(22px,2.2vw,30px)] uppercase leading-none">
                  {gate.title}
                </h3>
                <p className="text-[15px] text-snow/60">{gate.body}</p>
                <ul className="mt-auto flex flex-col gap-2.5">
                  {gate.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-baseline gap-2.5 text-[13px] text-snow/55"
                    >
                      <span className="shrink-0 text-mint">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
