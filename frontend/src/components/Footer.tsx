import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BracketLabel } from './ui/BracketLabel'
import { FlipButton } from './ui/FlipButton'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { footer } from '../data/content'

gsap.registerPlugin(ScrollTrigger)

/** Newsletter capture + the oversized wordmark that rises on scroll. */
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
      <div className="grid gap-[clamp(28px,5vw,72px)] px-[clamp(20px,4vw,64px)] pt-[clamp(80px,12vh,140px)] pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="flex flex-col gap-4">
          <BracketLabel>{footer.label}</BracketLabel>
          <SplitHeading
            className="text-[clamp(38px,5.6vw,84px)]"
            lines={[
              footer.headingLines[0],
              <span key="cf" className="text-mint">
                {footer.headingLines[1]}
              </span>,
              footer.headingLines[2],
            ]}
          />
          <p className="max-w-[44ch] text-snow/60">{footer.note}</p>

          <form
            className="mt-8 flex flex-wrap gap-2.5"
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
              aria-label="Email"
              className="min-w-[260px] rounded-full border border-snow/25 bg-transparent px-5.5 py-3.5 outline-none transition-colors placeholder:text-snow/40 focus:border-mint"
            />
            <FlipButton type="submit" variant="solid">
              Submit
            </FlipButton>
          </form>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-2">
          <span className="mb-1.5 text-[13px] uppercase tracking-[0.14em] text-snow/40">
            [&nbsp;{footer.exploreLabel}&nbsp;]
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {footer.exploreLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-display text-[clamp(20px,2.2vw,30px)] uppercase leading-tight opacity-85 transition-[color,padding,opacity] duration-300 hover:pl-2 hover:text-mint hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="grid gap-4 px-[clamp(20px,4vw,64px)] pb-15 md:grid-cols-3">
        {footer.community.map((card, index) => (
          <Reveal key={card.name} delay={index * 0.08}>
            <a
              href={card.href}
              className="group flex min-h-[170px] flex-col justify-between rounded-[20px] border border-snow/10 p-6.5 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-mint"
            >
              <span className="font-display text-2xl uppercase">{card.name}</span>
              <span className="text-[12.5px] text-snow/40">{card.desc}</span>
              <span className="self-end text-snow/60 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-mint">
                &#8599;
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-4 border-t border-snow/10 px-5.5 py-5.5 text-[12px] text-snow/40">
        <span>{footer.legalLeft}</span>
        <span>{footer.legalRight}</span>
      </div>

      <div
        ref={wordRef}
        aria-hidden="true"
        className="select-none px-0 pb-0 text-center font-display text-[clamp(120px,26vw,460px)] leading-[0.78] tracking-[-0.01em] text-snow/95"
      >
        {footer.bigWordLeft}
        <span className="text-mint">{footer.bigWordRight}</span>
      </div>

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
