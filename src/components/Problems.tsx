import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Emphasized } from './ui/Emphasized'
import { SplitHeading } from './ui/SplitHeading'
import { problems } from '../data/content'

/**
 * Equivalent of the reference site's "…was underutilized / …was fragmented"
 * rows — each existing approach is struck through, then Nummuss answers.
 */
export function Problems() {
  return (
    <section
      id="problem"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <div className="mb-[clamp(40px,7vh,80px)] flex max-w-[1200px] flex-col gap-5">
        <BracketLabel>Positioning</BracketLabel>
        <SplitHeading
          className="max-w-[16ch] text-[clamp(38px,6.5vw,92px)]"
          lines={[
            <>
              Warnings Are
            </>,
            <>
              Not <span className="text-danger">Enough</span>
            </>,
          ]}
        />
        <p className="max-w-[62ch] text-[clamp(17px,1.5vw,21px)] text-snow/60">
          Everyone warns. Nobody enforces. Nummuss blocks the action, names the failure mode, logs
          the evidence — and measures what would have happened without it.
        </p>
      </div>

      <div>
        {problems.map((row) => (
          <motion.div
            key={row.idx}
            className="grid items-baseline gap-[clamp(14px,3vw,48px)] border-t border-snow/10 px-0 py-7.5 transition-colors duration-300 hover:bg-snow/5 md:grid-cols-[44px_1.1fr_1.6fr]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[13px] text-snow/40">{row.idx}</span>

            <h3
              className={`font-display text-[clamp(20px,2.6vw,34px)] uppercase leading-[1.05] ${
                row.answer ? 'text-mint' : ''
              }`}
            >
              <span className="relative inline-block">
                {row.strike}
                {!row.answer && (
                  <motion.span
                    className="absolute top-1/2 left-0 h-[3px] w-full origin-left bg-danger"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.76, 0, 0.24, 1] }}
                  />
                )}
              </span>
            </h3>

            <p className="text-[clamp(15px,1.3vw,17px)] text-snow/60">
              <Emphasized text={row.body} emphasis={row.emphasis} />
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
