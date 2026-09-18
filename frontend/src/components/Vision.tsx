import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { vision } from '../data/content'

export function Vision() {
  return (
    <section
      id="vision"
      className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]"
    >
      <Reveal className="grid items-start gap-[clamp(24px,5vw,80px)] md:grid-cols-[auto_1fr]">
        <div>
          <BracketLabel>{vision.label}</BracketLabel>
          <SplitHeading
            className="mt-3.5 text-[clamp(40px,7vw,110px)]"
            lines={[
              <>
                {vision.headingLead} <span className="text-mint">{vision.headingAccent}</span>
              </>,
            ]}
          />
        </div>
        <p className="max-w-[56ch] text-[clamp(17px,1.6vw,22px)] text-snow/60">
          <strong className="font-semibold text-snow">{vision.strongPrefix}</strong>{' '}
          {vision.body.replace(vision.strongPrefix, '').trim()}
        </p>
      </Reveal>
    </section>
  )
}
