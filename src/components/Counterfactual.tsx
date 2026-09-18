import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { counterfactual } from '../data/content'

/** Twin portfolio curves — the two paths draw themselves as the block enters view. */
function TwinChart() {
  return (
    <div className="rounded-[22px] border border-snow/10 p-6.5 chart-grid">
      <div className="mb-3.5 flex flex-wrap justify-between gap-2.5 text-[11px] uppercase tracking-[0.16em] text-snow/40">
        <span>
          <b className="font-semibold text-mint">&bull;</b> Disciplined
        </span>
        <span>
          <b className="font-semibold text-danger">&bull;</b> Undisciplined twin
        </span>
        <span>{counterfactual.chartCaption.start}</span>
      </div>

      <svg viewBox="0 0 500 300" role="img" aria-label="Twin portfolio curves diverging">
        <motion.path
          className="chart-path"
          stroke="#ff4d3d"
          d="M10,250 C60,240 90,255 120,235 S180,250 210,215 S280,235 320,195 S400,215 490,185"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.5, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.path
          className="chart-path"
          stroke="#02fa6a"
          d="M10,250 C70,245 110,230 150,225 S230,205 280,180 S380,140 490,95"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.2, delay: 0.2, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.4 } }}
        />
        <motion.circle
          cx="490"
          cy="95"
          r="5"
          fill="#02fa6a"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 2.2, duration: 0.4 }}
          style={{ transformOrigin: '490px 95px' }}
        />
        <motion.circle
          cx="490"
          cy="185"
          r="5"
          fill="#ff4d3d"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 2.4, duration: 0.4 }}
          style={{ transformOrigin: '490px 185px' }}
        />
        <text x="10" y="292" fill="rgba(245,244,239,.4)" fontSize="11" letterSpacing="1">
          {counterfactual.chartCaption.clock}
        </text>
        <text x="378" y="80" fill="#02fa6a" fontSize="11">
          +14.2%
        </text>
        <text x="430" y="175" fill="#ff4d3d" fontSize="11">
          -1.4%
        </text>
      </svg>
    </div>
  )
}

/**
 * The core differentiator: a side-by-side ledger of what discipline changed,
 * plus the divergence chart. Copy is careful to call this a simulation output.
 */
export function Counterfactual() {
  return (
    <section
      id="counterfactual"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>{counterfactual.label}</BracketLabel>
        <SplitHeading
          className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]"
          lines={counterfactual.headingLines}
        />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">
          {counterfactual.lead}
        </p>
      </div>

      <div className="grid items-center gap-[clamp(28px,5vw,72px)] lg:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-[22px] border border-snow/10">
            <div className="flex items-center justify-between border-b border-snow/10 px-5.5 py-4 text-[11px] uppercase tracking-[0.18em] text-snow/40">
              <span>India Replay · same NIFTY evidence</span>
              <span className="flex items-center gap-2 text-mint">
                <i className="h-1.75 w-1.75 animate-blink rounded-full bg-mint" />
                Simulation
              </span>
            </div>

            <div className="grid grid-cols-[1fr_100px_100px] px-5.5 py-2.5 text-[10px] uppercase tracking-[0.16em] text-snow/40">
              <span>Metric</span>
              <span className="text-right">Disciplined</span>
              <span className="text-right">Twin</span>
            </div>

            {counterfactual.rows.map((row) => (
              <div
                key={row.metric}
                className="tabular grid grid-cols-[1fr_100px_100px] border-b border-snow/5 px-5.5 py-3.75 last:border-b-0"
              >
                <span className="text-[14px] text-snow/60">{row.metric}</span>
                <span
                  className={`text-right font-display text-lg ${
                    row.highlight === 'disciplined' ? 'text-mint' : ''
                  }`}
                >
                  {row.disciplined}
                </span>
                <span
                  className={`text-right font-display text-lg ${
                    row.highlight === 'twin' ? 'text-mint' : 'text-snow/40'
                  }`}
                >
                  {row.twin}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between bg-mint/12 px-5.5 py-4.5">
              <span className="text-[12px] uppercase tracking-[0.14em] text-snow/60">
                Capital difference
              </span>
              <span className="font-display text-[clamp(24px,2.6vw,34px)] text-mint">
                {counterfactual.capitalDifference}
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <TwinChart />
        </Reveal>
      </div>
    </section>
  )
}
