import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisRef: Lenis | null = null

/** Smoothly scroll to an in-page anchor, via Lenis when it is running. */
export function scrollToId(hash: string) {
  const id = hash.replace(/^#/, '')
  const target = id && id !== 'top' ? document.getElementById(id) : document.body
  if (!target) return
  if (lenisRef) {
    lenisRef.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 })
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function stopScroll(stop: boolean) {
  if (!lenisRef) return
  if (stop) lenisRef.stop()
  else lenisRef.start()
}

/**
 * Boots Lenis inertia scrolling and wires it into GSAP's ticker so that
 * ScrollTrigger scrubbing stays perfectly in sync (the same technique the
 * reference site uses for its scroll-driven scenes).
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      lerp: 0.09,
    })
    lenisRef = lenis

    const onLenisScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onLenisScroll)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // fonts loading changes layout height — recalculate trigger positions
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const timeout = window.setTimeout(refresh, 800)

    return () => {
      window.removeEventListener('load', refresh)
      window.clearTimeout(timeout)
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef = null
    }
  }, [])
}
