import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { useInView } from '../lib/useInView'
import { stats } from '../data/content'

/**
 * The FY26 evidence block. The giant numeral starts as an outline and fills in
 * when it scrolls into view — the same "reveal on scroll" flourish the reference
 * site uses on its oversized type.
 */
export function Stats() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 })

  return (
    <section
      id="stats"
      ref={ref}
      className="rule-top overflow-hidden px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <BracketLabel>{stats.label}</BracketLabel>

      <div
        className={`mt-4 font-display text-[clamp(72px,16vw,240px)] uppercase leading-[0.9] text-outline ${
          inView ? 'is-revealed' : ''
        }`}
      >
        <span className="text-mint [-webkit-text-stroke:0]">{stats.bigTop}</span>
        <br />
        {stats.bigBottom}
      </div>

      <Reveal delay={0.15}>
        <p className="mt-6 max-w-[62ch] text-[clamp(16px,1.5vw,20px)] text-snow/60">
          {stats.caption}
        </p>
      </Reveal>

      <div className="mt-[clamp(30px,5vh,56px)] flex flex-wrap gap-[clamp(20px,4vw,64px)]">
        {stats.cards.map((card) => (
          <Reveal key={card.label} className="min-w-[220px] flex-1">
            <div className="border-t border-snow/25 pt-4">
              <div
                className={`font-display text-[clamp(30px,3.6vw,52px)] ${
                  card.mint ? 'text-mint' : ''
                }`}
              >
                {card.value}
              </div>
              <div className="mt-1.5 text-[13px] uppercase tracking-[0.1em] text-snow/40">
                {card.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
