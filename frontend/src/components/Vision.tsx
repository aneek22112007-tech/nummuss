import { useRef } from 'react'
import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { SplitHeading } from './ui/SplitHeading'
import { vision } from '../data/content'

/**
 * Vision — "Trading AI doesn't need another prediction. It needs a brake."
 * Large editorial headline + body with inline failure-mode list.
 * Mirrors the reference site's two-column opening rhythm.
 */
export function Vision() {
  const listRef = useRef<HTMLUListElement>(null)

  return (
    <section
      id="vision"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      {/* eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <BracketLabel>{vision.label}</BracketLabel>
      </motion.div>

      {/* big headline */}
      <SplitHeading
        className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,116px)]"
        delay={0.05}
        lines={[
          vision.headingLines[0],
          vision.headingLines[1],
          <span key="brake" className="text-mint">{vision.headingLines[2]}</span>,
        ]}
      />

      {/* body + failure-mode list — two-column on large screens */}
      <div className="mt-[clamp(40px,7vh,80px)] grid gap-[clamp(28px,6vw,96px)] md:grid-cols-[1fr_1fr] lg:grid-cols-[3fr_2fr]">
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="max-w-[58ch] text-[clamp(17px,1.55vw,22px)] text-snow/60">
            {vision.body}
          </p>
          <p className="max-w-[58ch] text-[clamp(15px,1.35vw,18px)] text-snow/40">
            {vision.note}
          </p>
        </motion.div>

        {/* failure-mode pill list */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-snow/35">
            [ Failure modes targeted ]
          </p>
          <ul ref={listRef} className="flex flex-col gap-3">
            {vision.failureModes.map((mode, i) => (
              <motion.li
                key={mode}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="h-px w-5 shrink-0 bg-mint/60" />
                <span className="text-[clamp(14px,1.2vw,16px)] text-snow/60">{mode}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
