import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FlipButton } from './ui/FlipButton'
import { Reveal } from './ui/Reveal'
import { footer } from '../data/content'

gsap.registerPlugin(ScrollTrigger)

/** Multi-column footer + email capture + oversized NUMMUSS wordmark. */
export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const wordRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const word = wordRef.current
    if (!word) return

    const tween = gsap.fromTo(
      word,
      { yPercent: 16 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: word,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <footer className="rule-top">
      {/* Top grid: email form + 4-column nav */}
      <div className="grid gap-[clamp(40px,7vw,100px)] px-[clamp(20px,4vw,64px)] pt-[clamp(80px,12vh,140px)] pb-16 lg:grid-cols-[1.2fr_1fr]">

        {/* Left — CTA + email form */}
        <Reveal className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-snow/35">
              [ Stay in the loop ]
            </p>
            <h2 className="font-display text-[clamp(36px,5.2vw,78px)] uppercase leading-[0.94]">
              Follow the{' '}
              <span className="text-mint">Build.</span>
            </h2>
          </div>
          <p className="max-w-[44ch] text-[clamp(15px,1.4vw,18px)] text-snow/55">{footer.note}</p>

          <form
            className="mt-4 flex flex-wrap gap-2.5"
            onSubmit={(event) => {
              event.preventDefault()
              setSubscribed(true)
              setEmail('')
              window.setTimeout(() => setSubscribed(false), 3200)
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              aria-label="Email address for updates"
              className="min-w-[240px] rounded-full border border-snow/25 bg-transparent px-5.5 py-3.5 outline-none transition-colors placeholder:text-snow/35 focus:border-mint"
            />
            <FlipButton type="submit" variant="solid">
              Stay Updated
            </FlipButton>
          </form>
        </Reveal>

        {/* Right — 4-column link nav */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {footer.columns.map((col) => (
              <div key={col.label} className="flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-[0.16em] text-snow/35">
                  {col.label}
                </span>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[14px] text-snow/60 transition-colors duration-200 hover:text-mint"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Legal strip */}
      <div className="flex flex-wrap justify-between gap-4 border-t border-snow/8 px-[clamp(20px,4vw,64px)] py-4 text-[11px] text-snow/35">
        <span>{footer.legalLeft}</span>
        <span>{footer.legalRight}</span>
      </div>

      {/* Oversized NUMMUSS wordmark — parallax scroll-rise */}
      <div
        ref={wordRef}
        aria-hidden="true"
        className="select-none overflow-hidden text-center font-display text-[clamp(120px,26vw,460px)] leading-[0.78] tracking-[-0.01em] text-snow/90"
      >
        {footer.bigWordLeft}
        <span className="text-mint">{footer.bigWordRight}</span>
      </div>

      {/* Toast on subscribe */}
      <AnimatePresence>
        {subscribed && (
          <motion.div
            className="fixed bottom-6.5 left-1/2 z-60 -translate-x-1/2 rounded-xl bg-snow px-5 py-3 text-[14px] font-semibold text-charcoal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Subscribed — see you at submission day · Sept 20, 2026
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
