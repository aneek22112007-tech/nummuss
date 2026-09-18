import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { BracketLabel } from './ui/BracketLabel'
import { SplitHeading } from './ui/SplitHeading'
import { securityVerification } from '../data/content'

const colorClasses: Record<string, string> = {
  amber: 'text-amber border-amber/30 bg-amber/8',
  snow: 'text-snow/70 border-snow/15 bg-snow/5',
  mint: 'text-mint border-mint/30 bg-mint/8',
  danger: 'text-danger border-danger/30 bg-danger/10 font-bold',
}

/**
 * Security Verification — "TRY TO BREAK IT."
 * Shows the prompt-injection fixture flowing through Bedrock Guardrails → BLOCKED.
 */
export function SecurityVerification() {
  const [typedIdx, setTypedIdx] = useState(0)
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Trigger typing when section enters viewport
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Stagger the flow items appearing
  useEffect(() => {
    if (!show) return
    const interval = setInterval(() => {
      setTypedIdx((prev) => {
        if (prev >= securityVerification.flow.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 600)
    return () => clearInterval(interval)
  }, [show])

  return (
    <section
      id="security"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <div className="grid gap-[clamp(40px,7vw,100px)] lg:grid-cols-[1fr_1.1fr]">
        {/* Left — heading + explanation */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            <BracketLabel>{securityVerification.label}</BracketLabel>
          </motion.div>

          <SplitHeading
            className="max-w-[12ch] text-[clamp(38px,6.5vw,92px)]"
            delay={0.05}
            lines={[
              securityVerification.headingLines[0],
              <span key="b" className="text-danger">{securityVerification.headingLines[1]}</span>,
            ]}
          />

          <motion.p
            className="max-w-[52ch] text-[clamp(16px,1.5vw,19px)] text-snow/60"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {securityVerification.lead}
          </motion.p>

          <motion.p
            className="max-w-[52ch] text-[14px] text-snow/35"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            {securityVerification.disclaimer}
          </motion.p>
        </div>

        {/* Right — terminal flow */}
        <motion.div
          ref={ref}
          className="sec-terminal flex flex-col divide-y divide-snow/8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* header bar */}
          <div className="flex items-center gap-2 px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-mint/70" />
            <span className="ml-3 text-[10px] uppercase tracking-[0.2em] text-snow/30">
              {securityVerification.badge}
            </span>
          </div>

          {/* injected fixture */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-amber/70">
              Injected input fixture
            </p>
            <p className="font-mono text-[13px] text-amber/90 leading-relaxed">
              {securityVerification.fixture}
            </p>
          </div>

          {/* flow steps */}
          <div className="flex flex-col gap-0 px-5 py-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-snow/30">
              Processing flow
            </p>
            {securityVerification.flow.map((step, i) => (
              <div key={step.label} className="sec-flow-arrow flex flex-col items-center">
                <motion.div
                  className={`w-full rounded-lg border px-3 py-2 text-[12px] font-mono tracking-[0.08em] ${colorClasses[step.color]}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={typedIdx > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step.label}
                  {i === securityVerification.flow.length - 1 && typedIdx >= securityVerification.flow.length && (
                    <span className="ml-2 inline-block h-3 w-1.5 animate-blink bg-danger/70" />
                  )}
                </motion.div>
                {i < securityVerification.flow.length - 1 && (
                  <motion.span
                    className="my-1 text-[10px] text-snow/25"
                    animate={{ opacity: typedIdx > i ? 1 : 0 }}
                  >
                    ↓
                  </motion.span>
                )}
              </div>
            ))}
          </div>

          {/* result note */}
          {typedIdx >= securityVerification.flow.length && (
            <motion.div
              className="px-5 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[12px] text-snow/40">
                The injected instruction was blocked by Amazon Bedrock Guardrails before reaching
                the reasoning agent. No trade signal was produced.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
