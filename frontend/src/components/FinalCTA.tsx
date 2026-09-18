import { useEffect, useRef } from 'react'
import { FlipButton } from './ui/FlipButton'
import { finalCta } from '../data/content'

/**
 * Final CTA — "DON'T PREDICT MORE. CONTROL BETTER."
 *
 * Oversized display typography that fills the viewport. Each word reveals
 * from below its clipping container as the section scrolls into view.
 * The reference site's closing "statement" section — negative space dominant,
 * two CTAs at the bottom.
 */
export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null)
  const linesRef = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          linesRef.current.forEach((el, i) => {
            if (!el) return
            const inner = el.querySelector<HTMLSpanElement>('[data-inner]')
            if (!inner) return
            setTimeout(() => {
              inner.style.transform = 'translateY(0%)'
              inner.style.opacity = '1'
            }, i * 130)
          })
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="closing"
      ref={sectionRef}
      className="rule-top flex min-h-[100svh] flex-col items-start justify-between px-[clamp(20px,4vw,64px)] py-[clamp(80px,12vh,140px)]"
    >
      {/* oversized stacked headline */}
      <div aria-label={finalCta.lines.join(' ')} className="w-full">
        <h2 className="font-display text-[clamp(52px,12vw,180px)] uppercase leading-[0.88] tracking-[-0.02em]">
          {finalCta.lines.map((word, i) => (
            <span
              key={word}
              ref={(el) => { linesRef.current[i] = el }}
              className="block overflow-hidden"
            >
              <span
                data-inner=""
                style={{
                  display: 'block',
                  transform: 'translateY(106%)',
                  opacity: 0,
                  transition: `transform 1.1s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease`,
                }}
                className={i % 2 === 1 ? 'text-mint' : ''}
              >
                {word}
              </span>
            </span>
          ))}
        </h2>
      </div>

      {/* bottom — sub-label + CTAs */}
      <div className="flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[44ch] text-[clamp(15px,1.4vw,18px)] text-snow/45">
          {finalCta.sub}
        </p>
        <div className="flex flex-wrap gap-4 shrink-0">
          <FlipButton href={finalCta.primaryCta.href} variant="mint" size="lg">
            {finalCta.primaryCta.label}
          </FlipButton>
          <FlipButton href={finalCta.secondaryCta.href} size="lg">
            {finalCta.secondaryCta.label}
          </FlipButton>
        </div>
      </div>

      {/* disclaimer strip */}
      <p className="mt-8 w-full border-t border-snow/8 pt-5 text-[11px] uppercase tracking-[0.2em] text-snow/30">
        Simulation only · No real capital · Not investment advice
      </p>
    </section>
  )
}
