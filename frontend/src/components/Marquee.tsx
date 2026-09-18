import { marqueeItems } from '../data/content'

/** Infinite ticker strip — the reference site runs one under the hero. */
export function Marquee() {
  const group = (
    <span className="flex items-center gap-14 whitespace-nowrap font-display text-[22px] uppercase text-snow/60">
      {marqueeItems.map((item) => (
        <span key={item} className="flex items-center gap-14">
          {item}
          <em className="not-italic text-mint">&bull;</em>
        </span>
      ))}
    </span>
  )

  return (
    <div className="relative z-20 overflow-hidden border-y border-snow/10 bg-charcoal py-4.5">
      <div className="flex w-max animate-marquee gap-14">
        {group}
        {group}
      </div>
    </div>
  )
}
