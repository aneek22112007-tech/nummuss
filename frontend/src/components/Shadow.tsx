import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { useInView } from '../lib/useInView'
import { shadow, shadowExchanges } from '../data/content'

/**
 * POST /shadow demo. The first request types itself out, then the deterministic
 * verdicts appear — a terminal record of the evidence gate + behavioral engine.
 */
export function Shadow() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const [typed, setTyped] = useState('')
  const [exchangeIndex, setExchangeIndex] = useState(0)

  const current = shadowExchanges[exchangeIndex]
  const typingDone = typed.length >= current.request.length

  useEffect(() => {
    if (!inView) return
    setTyped('')
    let index = 0
    const id = window.setInterval(() => {
      index += 2
      setTyped(current.request.slice(0, index))
      if (index >= current.request.length) window.clearInterval(id)
    }, 16)
    return () => window.clearInterval(id)
  }, [inView, current.request])

  // after a verdict is revealed, roll on to the next canned challenge
  useEffect(() => {
    if (!typingDone) return
    const id = window.setTimeout(() => {
      setExchangeIndex((value) => (value + 1) % shadowExchanges.length)
    }, 4200)
    return () => window.clearTimeout(id)
  }, [typingDone])

  return (
    <section id="shadow" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <div className="grid items-center gap-[clamp(28px,5vw,72px)] lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="flex flex-col gap-4">
          <BracketLabel>{shadow.label}</BracketLabel>
          <SplitHeading
            className="text-[clamp(34px,5vw,72px)]"
            lines={shadow.headingLines}
          />
          <p className="max-w-[52ch] text-snow/60">{shadow.lead}</p>
          <p className="mt-2 border-l-2 border-mint pl-3.5 text-[13px] text-snow/40">
            {shadow.note}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div
            ref={ref}
            className="overflow-hidden rounded-[18px] border border-snow/10 bg-ink font-mono text-[13.5px]"
          >
            <div className="flex items-center gap-2 border-b border-snow/10 px-4 py-3">
              <i className="h-2.5 w-2.5 rounded-full bg-danger" />
              <i className="h-2.5 w-2.5 rounded-full bg-amber" />
              <i className="h-2.5 w-2.5 rounded-full bg-mint" />
              <span className="ml-auto text-[11px] tracking-[0.1em] text-snow/40">
                POST /shadow · rate-limited
              </span>
            </div>

            <div className="flex flex-col gap-3 px-5 py-5 leading-relaxed">
              <div className="text-snow">
                <span className="text-mint">&#10142; </span>
                {typed}
                {!typingDone && <span className="caret" />}
              </div>

              {typingDone && (
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-snow/40">
                    &rarr; evaluating · evidence gate · behavioral engine &hellip;
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-md px-2.5 py-0.75 font-bold tracking-[0.08em] ${
                        current.verdict === 'BLOCKED'
                          ? 'border border-danger/40 bg-danger/15 text-danger'
                          : 'border border-mint/40 bg-mint/12 text-mint'
                      }`}
                    >
                      {current.verdict}
                    </span>
                    <span className="ml-3 text-amber">reason: {current.reason}</span>
                  </div>
                  {current.signals.map((signal) => (
                    <div key={signal} className="text-snow/40">
                      {signal}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
