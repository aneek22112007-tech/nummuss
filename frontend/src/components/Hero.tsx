import { useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { ScrollVideo, type VideoSources } from './ScrollVideo'
import { HeroCanvas } from './HeroCanvas'
import { FlipButton } from './ui/FlipButton'
import { hero } from '../data/content'

/**
 * Hero assets. Paths are relative so the built page works from any base path.
 * Regenerate with `npm run render:hero`.
 */
const heroVideo: VideoSources = {
  large: 'hero/hero-1600.mp4',
  small: 'hero/hero-960.mp4',
  webm: 'hero/hero-1600.webm',
  poster: 'hero/poster.jpg',
}

const smoothstep = (value: number) => {
  const t = value < 0 ? 0 : value > 1 ? 1 : value
  return t * t * (3 - 2 * t)
}

/**
 * Opening scene.
 *
 * The section is two viewports tall with a sticky stage, which gives the video
 * scroll distance to scrub across: scrolling pushes the camera through the cave
 * mouth while the headline lifts, blurs and fades away to hand off to the page.
 */
export function Hero({ onTryClick: _onTryClick }: { onTryClick?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const handleProgress = useCallback((progress: number) => {
    // copy leaves early so the artwork owns the second half of the scrub
    const fade = smoothstep(Math.min(progress * 1.6, 1))
    const copy = copyRef.current
    if (copy) {
      copy.style.opacity = String(1 - fade)
      copy.style.transform = `translate3d(0, ${-fade * 60}px, 0)`
      copy.style.visibility = fade > 0.995 ? 'hidden' : 'visible'
    }

    // A cinematic push-in without destroying the image quality
    const stage = stageRef.current
    if (stage) {
      // Gentle scale to simulate moving forward
      const zoom = progress * 0.4;
      stage.style.transform = `scale(${1 + zoom})`;
      
      // Remove the blur/brightness filters that caused the white screen
      stage.style.filter = 'none';
      
      // Fade out smoothly right at the end to blend perfectly into the dark Marquee
      // Because we reduced the height to 150svh, this fade won't leave a huge black gap
      const fadeVideo = progress > 0.85 ? (progress - 0.85) * 6.66 : 0;
      stage.style.opacity = String(Math.max(0, 1 - fadeVideo));
    }
  }, [])


  return (
    <section id="top" ref={sectionRef} className="relative h-[150svh] bg-charcoal">
      <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden">
        <div ref={stageRef} className="absolute inset-0 origin-center will-change-transform">
          <ScrollVideo
            sources={heroVideo}
            progressRef={sectionRef}
            onProgress={handleProgress}
            fallback={<HeroCanvas />}
          />
        </div>

        {/* vignette that keeps the type legible over the artwork */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 42%, rgba(11,13,12,0) 38%, rgba(11,13,12,0.5) 76%, rgba(11,13,12,0.9) 100%)',
          }}
        />

        <div ref={copyRef} className="absolute inset-0 z-20 will-change-[opacity,transform]">
          <motion.div
            className="absolute top-24 left-[clamp(20px,4vw,64px)] hidden items-center gap-2 rounded-full border border-snow/25 bg-charcoal/35 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-snow/60 backdrop-blur-sm sm:flex"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            <span className="h-2 w-2 animate-blink rounded-full bg-mint" />
            {hero.badge}
          </motion.div>

          <motion.div 
            className="flex h-full flex-col items-center justify-end gap-6.5 px-[clamp(20px,4vw,64px)] pb-[clamp(48px,9vh,96px)] text-center"
            initial={{ scale: 0.4, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="max-w-[14ch] font-display text-[clamp(44px,8.5vw,124px)] uppercase leading-[0.92]">
              {hero.titleLines.map((line, index) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{
                      duration: 1.1,
                      delay: 0.4 + index * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="max-w-[52ch] text-[clamp(16px,1.6vw,20px)] text-snow/60"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {hero.subtitle}
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-3.5"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <FlipButton href="#shadow" variant="mint" size="lg">
                Challenge Nummuss
              </FlipButton>
              <FlipButton href="/dashboard" size="lg">
                Enter Dashboard
              </FlipButton>
            </motion.div>
          </motion.div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-hint flex flex-col items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-snow/35">Scroll</span>
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true">
              <path d="M6 0v14M1 9l5 9 5-9" stroke="rgba(245,244,239,0.35)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* scrub position readout — the "frame N / 300" style caption the
            reference site uses to signal the scene is scroll-driven */}
        <div className="pointer-events-none absolute right-[clamp(20px,4vw,64px)] bottom-6 z-20 hidden text-[10px] uppercase tracking-[0.24em] text-snow/30 md:block">
          Behavioral Safety Layer · Scroll-driven
        </div>
      </div>
    </section>
  )
}
