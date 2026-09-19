import { motion } from 'framer-motion'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { safetyGates } from '../data/content'

/* ---------- Animated mini-visuals ---------- */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -5 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
}

function GateVisualL0() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="relative h-[140px] overflow-hidden rounded-xl border border-snow/10 bg-charcoal-soft/40 p-4 font-mono text-[11px]"
    >
      <div className="gate-scan-line bg-mint/50" />
      <motion.p variants={itemVariants} className="text-amber/80">
        INPUT  <span className="text-snow/40">→</span>
      </motion.p>
      <motion.p variants={itemVariants} className="mt-1.5 truncate text-snow/40">
        &quot;IGNORE PREVIOUS INSTRUCTIONS…&quot;
      </motion.p>
      <motion.div variants={itemVariants} className="mt-3 flex items-center gap-2 rounded bg-danger/10 px-2 py-1 border border-danger/20 w-max">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
        <p className="text-danger font-bold tracking-wide">CONTENT FILTER TRIGGERED</p>
      </motion.div>
      <motion.p variants={itemVariants} className="mt-2 text-[9px] uppercase tracking-widest text-snow/30">
        bedrock guardrails · AWS-managed
      </motion.p>
    </motion.div>
  )
}

function GateVisualL1() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="relative h-[140px] overflow-hidden rounded-xl border border-snow/10 bg-charcoal-soft/40 p-4 font-mono text-[11px]"
    >
      <div className="gate-scan-line bg-mint/50" />
      <div className="flex flex-col gap-2">
        <motion.div variants={itemVariants} className="flex items-center gap-2.5">
          <span className="text-mint font-bold">✓</span>
          <span className="text-snow/60">ticker: NIFTY50 present in context</span>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2.5">
          <span className="text-mint font-bold">✓</span>
          <span className="text-snow/60">price: traceable to signal_id</span>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2.5">
          <span className="text-danger font-bold">✗</span>
          <span className="text-snow/60">sources: 1 (below floor of 2)</span>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-1 flex items-center gap-2 border-t border-snow/10 pt-2">
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-amber font-bold">→ HOLD</span>
          <span className="text-snow/40">evidence insufficient</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

function GateVisualL2() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="relative h-[140px] overflow-hidden rounded-xl border border-snow/10 bg-charcoal-soft/40 p-4 font-mono text-[11px]"
    >
      <div className="gate-scan-line bg-mint/50" />
      <div className="flex flex-col gap-2">
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="text-snow/40 uppercase tracking-wider">Proposed:</span>
          <span className="text-snow/80">BUY 2x after 3 losses</span>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger font-bold">COOLDOWN</span>
          <span className="text-snow/50">2 losses → pause 4 cycles</span>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger font-bold">POSITION CAP</span>
          <span className="text-snow/50">&gt;5% portfolio</span>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-1 flex items-center gap-2 border-t border-snow/10 pt-2">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
          <span className="text-danger font-bold uppercase tracking-wider">Blocked · revenge trading</span>
        </motion.div>
      </div>
    </motion.div>
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
      <div className="mb-[clamp(50px,8vh,90px)] flex max-w-[1200px] flex-col gap-6">
        <BracketLabel>Safety Architecture</BracketLabel>
        <SplitHeading
          className="max-w-[14ch] text-[clamp(42px,7vw,100px)]"
          lines={[
            'Three',
            <span key="s" className="text-mint">Safety</span>,
            'Gates.',
          ]}
        />
        <p className="max-w-[62ch] text-[clamp(16px,1.5vw,20px)] text-snow/50">
          AWS-managed content safety, application-owned deterministic evidence validation, and
          behavioral trading-discipline rules — before anything executes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {safetyGates.map((gate, index) => {
          const Visual = gateVisuals[index]
          return (
            <Reveal key={gate.title} delay={index * 0.15} className="h-full">
              <article className="gate-card group relative flex h-full min-h-[420px] flex-col gap-5 overflow-hidden rounded-[24px] border border-snow/10 bg-charcoal-soft/30 p-8 transition-colors duration-500 hover:border-snow/30 hover:bg-snow/5">
                
                {/* mini visual scene */}
                {Visual && <Visual />}

                <div className="mt-2 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint">
                    {gate.layer}
                  </span>
                  <h3 className="font-display text-[clamp(24px,2.5vw,34px)] uppercase leading-[1.1]">
                    {gate.title}
                  </h3>
                </div>
                
                <p className="text-[15px] leading-relaxed text-snow/50">{gate.body}</p>
                
                <ul className="mt-auto flex flex-col gap-3 pt-4 border-t border-snow/5">
                  {gate.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-[13.5px] text-snow/60 transition-colors duration-300 group-hover:text-snow/80"
                    >
                      <span className="shrink-0 mt-0.5 text-[10px] text-mint/70 transition-colors duration-300 group-hover:text-mint">▶</span>
                      <span className="leading-tight">{point}</span>
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

