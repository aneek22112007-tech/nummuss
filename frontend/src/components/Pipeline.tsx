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

    const nodes = Array.from(list.querySelectorAll<HTMLElement>('.pipe-wrapper'))
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
    <section id="experiment" className="rule-top bg-charcoal relative z-10">
      {/* tall wrapper gives the sticky child its scroll distance to scrub through */}
      <div ref={wrapRef} className="relative h-[150svh]">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center gap-[clamp(8px,1vh,16px)] px-[clamp(20px,4vw,64px)] py-[clamp(24px,3vh,40px)]">
          <BracketLabel>{pipelineCopy.label}</BracketLabel>

          <SplitHeading
            className="text-[clamp(28px,4vw,64px)]"
            lines={[
              pipelineCopy.headingLines[0],
              pipelineCopy.headingLines[1],
              <span key="gates" className="text-mint">
                {pipelineCopy.headingLines[2]}
              </span>,
            ]}
          />

          <p className="max-w-[60ch] text-[clamp(13px,1.2vw,16px)] text-snow/60">
            {pipelineCopy.lead}
          </p>

          <div ref={listRef} className="mt-2 flex max-w-[840px] flex-col gap-0.5">
            {pipelineSteps.map((step) => (
              <div key={step.tag + step.name} className="pipe-wrapper relative flex items-start gap-3 sm:gap-4">
                
                {/* Timeline Axis */}
                <div className="flex flex-col items-center mt-[16px] sm:mt-[20px]">
                  <div className={`pipe-status z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 border-snow/20 bg-charcoal transition-all duration-500`}>
                     <span className="pipe-status-inner h-1 w-1 rounded-full bg-snow/20 transition-all duration-500 scale-0 opacity-0" />
                  </div>
                  {step !== pipelineSteps[pipelineSteps.length - 1] && (
                    <div className="my-1 h-[25px] sm:h-[30px] w-[2px] rounded-full bg-snow/5 relative overflow-hidden">
                       <div className="pipe-flow absolute inset-x-0 top-0 h-full w-full bg-snow/40 origin-top scale-y-0 transition-transform duration-700 ease-out" />
                    </div>
                  )}
                </div>

                {/* Node Content */}
                <div
                  className={[
                    'pipe-node relative flex w-full flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-[16px] border border-snow/5 bg-charcoal-soft/30 p-2.5 sm:px-4 sm:py-2.5 transition-all duration-500',
                    step.gate ? 'is-gate' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-4 flex-1">
                     <span className="pipe-tag rounded-md border border-snow/10 bg-snow/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap text-snow/40 transition-colors duration-500">
                       {step.tag}
                     </span>
                     <span className="pipe-name text-[13px] sm:text-[15px] font-medium leading-tight text-snow/40 transition-colors duration-500">{step.name}</span>
                  </div>
                  <span className="pipe-detail hidden text-right font-mono text-[11px] text-snow/30 xl:block transition-colors duration-500">
                    {step.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex w-max items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-snow/40 bg-charcoal/80 py-1.5 px-3 rounded-lg backdrop-blur-sm z-20 border border-snow/5">
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
