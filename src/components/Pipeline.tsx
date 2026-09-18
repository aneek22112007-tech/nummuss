import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BracketLabel } from './ui/BracketLabel'
import { SplitHeading } from './ui/SplitHeading'
import { orbImages, pipelineCopy, pipelineSteps } from '../data/content'

gsap.registerPlugin(ScrollTrigger)

/**
 * The section pins while you scroll and walks the pipeline node by node:
 *  - the active node lights up (gates turn mint),
 *  - the side image panel cross-fades to the matching visual,
 *  - the progress bar + percentage track the cycle.
 *
 * State is toggled imperatively inside the ScrollTrigger callback instead of via
 * React state so scrubbing stays at 60fps with no re-renders.
 */
export function Pipeline() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const capRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const list = listRef.current
    if (!wrap || !list) return

    const nodes = Array.from(list.querySelectorAll<HTMLElement>('.pipe-node'))
    const images = Array.from(
      orbRef.current?.querySelectorAll<HTMLImageElement>('.orb-img') ?? [],
    )
    const total = nodes.length

    let lastActive = -1

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress

        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
        if (pctRef.current)
          pctRef.current.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`

        const active = Math.min(Math.floor(progress * (total + 0.4)), total - 1)
        if (active === lastActive) return
        lastActive = active

        nodes.forEach((node, index) => {
          node.classList.toggle('is-active', index <= active && progress > 0.02)
        })

        const step = pipelineSteps[active]
        if (step) {
          images.forEach((img) => {
            img.classList.toggle('is-active', img.dataset.orb === step.orb)
          })
          if (capRef.current) capRef.current.textContent = step.orbCaption
        }
      },
    })

    return () => trigger.kill()
  }, [])

  return (
    <section id="experiment" className="rule-top">
      {/* tall wrapper gives the sticky child its scroll distance to scrub through */}
      <div ref={wrapRef} className="relative h-[520svh]">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center gap-[clamp(20px,4vh,44px)] overflow-hidden px-[clamp(20px,4vw,64px)] pt-20 pb-10">
          <BracketLabel>{pipelineCopy.label}</BracketLabel>

          <SplitHeading
            className="text-[clamp(34px,5vw,72px)]"
            lines={[
              pipelineCopy.headingLines[0],
              pipelineCopy.headingLines[1],
              <span key="gates" className="text-mint">
                {pipelineCopy.headingLines[2]}
              </span>,
            ]}
          />

          <p className="max-w-[60ch] text-[clamp(15px,1.4vw,18px)] text-snow/60">
            {pipelineCopy.lead}
          </p>

          <div ref={listRef} className="mt-2 flex max-w-[760px] flex-col">
            {pipelineSteps.map((step) => (
              <div key={step.tag + step.name}>
                <div
                  className={[
                    'pipe-node flex items-center gap-4 rounded-[14px] border border-snow/10 bg-charcoal px-4.5 py-3.25',
                    step.gate ? 'is-gate' : '',
                  ].join(' ')}
                >
                  <span className="pipe-tag rounded-full border border-snow/25 px-2.25 py-0.75 text-[10px] uppercase tracking-[0.16em] whitespace-nowrap text-snow/60">
                    {step.tag}
                  </span>
                  <span className="text-[clamp(14px,1.4vw,17px)] font-semibold">{step.name}</span>
                  <span className="ml-auto hidden text-right text-[13px] text-snow/40 xl:block">
                    {step.detail}
                  </span>
                </div>
                <span
                  className={`ml-8.5 block h-5.5 w-px ${
                    step.gate ? 'bg-mint' : 'bg-snow/25'
                  } ${step === pipelineSteps[pipelineSteps.length - 1] ? 'hidden' : ''}`}
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-8.5 left-[clamp(20px,4vw,64px)] flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-snow/40">
            <span ref={pctRef}>00%</span>
            <span className="relative h-0.5 w-[140px] overflow-hidden rounded-full bg-snow/10">
              <i
                ref={barRef}
                className="absolute inset-0 origin-left bg-mint"
                style={{ transform: 'scaleX(0)' }}
              />
            </span>
            <span>Cycle progress</span>
          </div>

          <div
            ref={orbRef}
            className="absolute top-1/2 right-[clamp(20px,6vw,90px)] hidden w-[clamp(180px,24vw,380px)] -translate-y-1/2 overflow-hidden rounded-3xl border border-snow/10 xl:block"
            style={{ aspectRatio: '3 / 4' }}
          >
            {Object.entries(orbImages).map(([key, src], index) => (
              <img
                key={key}
                src={src}
                alt=""
                loading="lazy"
                data-orb={key}
                className={`orb-img absolute inset-0 h-full w-full object-cover ${
                  index === 0 ? 'is-active' : ''
                }`}
              />
            ))}
            <span
              ref={capRef}
              className="absolute bottom-3 left-3 z-10 rounded-full border border-snow/10 bg-charcoal/60 px-2.75 py-1.25 text-[10px] uppercase tracking-[0.2em] text-snow/60 backdrop-blur-sm"
            >
              {pipelineSteps[0].orbCaption}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
