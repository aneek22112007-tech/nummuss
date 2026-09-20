import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { replay } from '../data/content'

/** Historical replay stays empty until a real replay data source is connected. */
export function Replay() {
  return (
    <section id="replay" className="rule-top px-[clamp(20px,4vw,64px)] py-[clamp(90px,14vh,160px)]">
      <Reveal className="flex max-w-4xl flex-col gap-4">
        <BracketLabel>{replay.label}</BracketLabel>
        <SplitHeading className="text-[clamp(40px,7vw,104px)]" lines={[replay.headingLines[0], <span key="two" className="text-mint">{replay.headingLines[1]}</span>]} />
        <p className="max-w-[58ch] text-[clamp(16px,1.5vw,19px)] text-snow/60">Historical replay is disabled until verified historical market data is connected. No sample scenarios or simulated outcomes are displayed.</p>
      </Reveal>
    </section>
  )
}
