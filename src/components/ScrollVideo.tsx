import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'

export type VideoSources = {
  /** desktop master (16:9) */
  large: string
  /** lighter cut used on narrow viewports */
  small?: string
  /** optional VP9 alternative, tried first when supported */
  webm?: string
  poster: string
}

type Props = {
  sources: VideoSources
  /**
   * Element whose scroll travel drives the scrub. Defaults to this component's
   * own wrapper. Pass the tall hero section so the video scrubs across the
   * sticky range rather than just its own box.
   */
  progressRef?: RefObject<HTMLElement | null>
  /** Called every frame with 0→1 progress (used to fade the hero copy). */
  onProgress?: (progress: number) => void
  /** Rendered instead of the video when it cannot load (offline/codec). */
  fallback?: ReactNode
  className?: string
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

/**
 * Scroll-scrubbed video: the clip does not "play", it is *driven*. Each frame
 * reads the hero's scroll progress and eases `currentTime` toward it, so the
 * camera move advances and reverses with the visitor's scroll exactly like the
 * reference site's filmed scene.
 *
 * Touch devices are excluded from scrubbing — mobile browsers throttle and even
 * block repeated programmatic seeks on muted inline video — so they get the
 * clip on a silent loop instead. `prefers-reduced-motion` gets a still frame.
 */
export function ScrollVideo({
  sources,
  progressRef,
  onProgress,
  fallback,
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isTouch, setIsTouch] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  // keep the latest callback without re-subscribing the rAF loop
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const mode: 'scrub' | 'loop' | 'still' = reducedMotion ? 'still' : isTouch ? 'loop' : 'scrub'

  const handleReady = useCallback(() => setStatus('ready'), [])
  const handleError = useCallback(() => setStatus('error'), [])

  // --- blocking autoplay for the touch/loop variant ----------------------
  useEffect(() => {
    const video = videoRef.current
    if (!video || status !== 'ready') return

    if (mode === 'loop') {
      video.loop = true
      void video.play().catch(() => {
        /* autoplay refused — the poster simply stays up */
      })
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [mode, status])

  // --- the scrub driver --------------------------------------------------
  useEffect(() => {
    const target = progressRef?.current ?? wrapRef.current
    if (!target) return

    let raf = 0
    let alive = true
    let eased = 0
    let primed = false

    const tick = () => {
      const rect = target.getBoundingClientRect()
      const travel = Math.max(rect.height - window.innerHeight, 1)
      const progress = clamp01(-rect.top / travel)

      onProgressRef.current?.(progress)

      const video = videoRef.current
      if (video && mode === 'scrub' && status === 'ready' && video.duration > 0) {
        const targetTime = progress * Math.max(video.duration - 1 / 30, 0)
        if (!primed) {
          eased = targetTime
          primed = true
        } else {
          // weight the seek so fast flicks do not snap the camera around
          eased += (targetTime - eased) * 0.18
        }

        // never write while a seek is still in flight, and ignore sub-frame moves
        if (!video.seeking && Math.abs(video.currentTime - eased) > 1 / 60) {
          video.currentTime = eased
        }
      }

      if (alive) raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => {
      alive = false
      window.cancelAnimationFrame(raf)
    }
  }, [mode, progressRef, status])

  // if the file never loads we keep the poster — but a hard error swaps in the
  // canvas painter so the hero is never an empty box
  const showFallback = status === 'error' && Boolean(fallback)

  return (
    <div ref={wrapRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {showFallback ? (
        fallback
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={sources.poster}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
          onLoadedMetadata={handleReady}
          onError={handleError}
        >
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          {sources.large && (
            <source src={sources.large} media="(min-width: 901px)" type="video/mp4" />
          )}
          {sources.small && (
            <source src={sources.small} media="(max-width: 900px)" type="video/mp4" />
          )}
        </video>
      )}
    </div>
  )
}
