import { Link } from 'react-router-dom'
import { Reveal } from './ui/Reveal'

/** Landing-page entry point. Agent results are shown only after real API work. */
export function Shadow() {
  return (
    <section id="shadow" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-mint">Custom paper agent</p>
        <h2 className="mt-4 font-display text-[clamp(40px,6vw,90px)] uppercase leading-none text-snow">Build your Shadow Agent</h2>
        <p className="mt-6 max-w-2xl text-[clamp(16px,1.5vw,20px)] leading-relaxed text-snow/65">Create one time-bounded, paper-only strategy agent. Results appear only from verified market signals and persisted decisions—this page deliberately contains no simulated trade results.</p>
        <Link to="/shadow" className="mt-8 rounded-full bg-mint px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-charcoal transition-transform hover:scale-105">Open Shadow Lab</Link>
      </Reveal>
    </section>
  )
}
