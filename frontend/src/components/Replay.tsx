import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BracketLabel } from './ui/BracketLabel'
import { Reveal } from './ui/Reveal'
import { SplitHeading } from './ui/SplitHeading'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'
import type { ReplayScenarioResponse } from '../lib/api'
import { replay, replayScenarios } from '../data/content'

gsap.registerPlugin(ScrollTrigger)

/* ---------- Fallback scenario data from PRD v5.0 ---------- */
const SCENARIO_IMAGES: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1100&auto=format&fit=crop',
  '2': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1100&auto=format&fit=crop',
  '3': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1100&auto=format&fit=crop',
  '4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1100&auto=format&fit=crop',
}



function useScenario(id: string) {
  return useApi(() => api.replayScenario(id), null as ReplayScenarioResponse | null, id)
}

/* ---------- Single scenario card ---------- */
function ScenarioCard({
  idx,
  fallback,
}: {
  idx: number
  fallback: typeof replayScenarios[number]
}) {
  const id = String(idx + 1)
  const { data: live } = useScenario(id)

  const tag = live?.tag ?? fallback.tag
  const title = live?.title ?? fallback.title
  const body = live ? live.description : fallback.body
  const accent = fallback.accent
  const image = SCENARIO_IMAGES[id] ?? fallback.image

  return (
    <article
      id={`replay-scenario-${id}`}
      className="group relative flex h-[min(66svh,620px)] w-[clamp(300px,38vw,520px)] shrink-0 flex-col overflow-hidden rounded-[26px] border border-snow/10 bg-charcoal-soft"
    >
      <div className="relative flex-1 overflow-hidden">
        <span
          className={`absolute top-4 left-4 z-10 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm ${
            accent ? 'border-mint/40 text-mint' : 'border-snow/10 text-snow/60'
          } bg-charcoal/55`}
        >
          {tag}
        </span>
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover saturate-[0.85] transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-106"
        />
        <span className="absolute inset-0 bg-gradient-to-b from-transparent via-45% to-charcoal/90" />
      </div>

      <div className="flex flex-col gap-2 bg-[#0e100f] px-6 pt-5.5 pb-6.5">
        <h3 className="font-display text-[clamp(20px,1.9vw,26px)] uppercase">{title}</h3>
        <p className="text-[14px] text-snow/60">{body}</p>

        {/* Live stats from API */}
        {live && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-snow/8 pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-snow/30">Disciplined</p>
              <p className="font-mono text-[12px] text-mint">
                ₹{live.disciplined.portfolio_value.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-snow/35">{live.disciplined.max_drawdown_pct}% drawdown</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-snow/30">Twin</p>
              <p className="font-mono text-[12px] text-danger">
                ₹{live.twin.portfolio_value.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-snow/35">{live.twin.max_drawdown_pct}% drawdown · {live.twin.blocks} blocks</p>
            </div>
            <div className="col-span-2">
              <span className="text-[11px] text-mint/70">
                ₹{live.capital_difference_inr.toLocaleString('en-IN')} capital difference
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * India Replay section — horizontal scroll rail.
 * Each card fetches its scenario data from GET /replay/scenario/{id},
 * enriching cards with live portfolio metrics when the API is reachable.
 */
export function Replay() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return

    const tween = gsap.to(track, {
      x: () => {
        const distance = track.scrollWidth - window.innerWidth + 64
        return -Math.max(distance, 0)
      },
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <section id="replay" className="rule-top overflow-clip">
      <div className="px-[clamp(20px,4vw,64px)] pt-[clamp(90px,14vh,160px)] pb-10">
        <Reveal className="flex flex-col gap-4">
          <BracketLabel>{replay.label}</BracketLabel>
          <SplitHeading
            className="text-[clamp(40px,7vw,104px)]"
            lines={[
              replay.headingLines[0],
              <span key="two" className="text-mint">{replay.headingLines[1]}</span>,
            ]}
          />
          <p className="mt-2 max-w-[58ch] text-[clamp(16px,1.5vw,19px)] text-snow/60">{replay.lead}</p>
        </Reveal>
      </div>

      {/* scroll distance that the pinned rail travels across */}
      <div ref={wrapRef} className="relative h-[280svh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-[clamp(18px,2.4vw,36px)] px-[clamp(20px,4vw,64px)] will-change-transform"
          >
            {replayScenarios.map((scenario, idx) => (
              <ScenarioCard key={scenario.title} idx={idx} fallback={scenario} />
            ))}
          </div>

          <div className="absolute bottom-6.5 left-[clamp(20px,4vw,64px)] flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-snow/40">
            <i className="h-1.75 w-1.75 animate-blink rounded-full bg-amber" />
            {replay.note}
          </div>
        </div>
      </div>
    </section>
  )
}
