import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'

type Ember = {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  alpha: number
}

const EMBER_COUNT = 60

/**
 * The reference landing page opens on a full-bleed animated 3D scene (a cloaked
 * figure looking through a cave mouth onto a valley at sunset). That is a WebGL
 * render; here the same composition — retro sun, floating island, parallax
 * ridges, rising embers — is painted every frame on a 2D canvas, which keeps the
 * bundle tiny while preserving the motion.
 */
export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let frameId = 0
    let time = 0
    let scrollY = window.scrollY
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const embers: Ember[] = Array.from({ length: EMBER_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2.2 + 0.6,
      speed: Math.random() * 0.4 + 0.15,
      drift: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.2,
    }))

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, width * dpr)
      canvas.height = Math.max(1, height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onScroll = () => {
      scrollY = window.scrollY
    }
    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2
    }

    const drawSun = (cx: number, cy: number, r: number) => {
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.2)
      glow.addColorStop(0, 'rgba(255,214,120,0.95)')
      glow.addColorStop(0.18, 'rgba(255,170,70,0.85)')
      glow.addColorStop(0.45, 'rgba(255,110,50,0.28)')
      glow.addColorStop(1, 'rgba(255,80,40,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffd873'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // retro scanline slices across the lower half of the disc
      ctx.fillStyle = 'rgba(11,13,12,.85)'
      for (let i = 0; i < 6; i += 1) {
        const y = cy + r * 0.15 + i * (r * 0.16)
        ctx.fillRect(cx - r, y, r * 2, r * 0.05 + i * 1.1)
      }
    }

    const drawIsland = (cx: number, cy: number, size: number, alpha: number) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#1a0f08'
      ctx.beginPath()
      ctx.moveTo(cx - size, cy)
      ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.28, cx + size * 0.15, cy - size * 0.22)
      ctx.quadraticCurveTo(cx + size * 0.7, cy - size * 0.3, cx + size, cy - size * 0.02)
      ctx.quadraticCurveTo(cx + size * 0.55, cy + size * 0.34, cx, cy + size * 0.28)
      ctx.quadraticCurveTo(cx - size * 0.6, cy + size * 0.3, cx - size, cy)
      ctx.fill()

      // rock spikes hanging beneath the island
      ctx.beginPath()
      ctx.moveTo(cx - size * 0.45, cy + size * 0.16)
      ctx.lineTo(cx - size * 0.3, cy + size * 0.62)
      ctx.lineTo(cx - size * 0.14, cy + size * 0.18)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx + size * 0.1, cy + size * 0.26)
      ctx.lineTo(cx + size * 0.26, cy + size * 0.8)
      ctx.lineTo(cx + size * 0.4, cy + size * 0.24)
      ctx.fill()
      ctx.restore()
    }

    const drawRidge = (
      baseY: number,
      amplitude: number,
      seed: number,
      color: string,
      alpha: number,
    ) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(-10, height + 10)
      for (let x = -10; x <= width + 10; x += 14) {
        const y =
          baseY +
          Math.sin(x * 0.006 + seed) * amplitude +
          Math.sin(x * 0.017 + seed * 2.7) * amplitude * 0.4 +
          Math.sin(x * 0.041 + seed * 1.3) * amplitude * 0.15
        ctx.lineTo(x, y)
      }
      ctx.lineTo(width + 10, height + 10)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const render = () => {
      time += reducedMotion ? 0 : 0.016
      const exit = Math.min(scrollY / Math.max(height, 1), 1)
      const parallaxX = pointer.x * width * 0.02
      const parallaxY = pointer.y * height * 0.015

      ctx.clearRect(0, 0, width, height)

      const sky = ctx.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, '#160d0a')
      sky.addColorStop(0.4, '#3d160c')
      sky.addColorStop(0.68, '#a63d1a')
      sky.addColorStop(0.85, '#e0742f')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      const sunX = width / 2 + parallaxX
      const sunY = height * 0.46 - exit * height * 0.18 + parallaxY
      drawSun(sunX, sunY, Math.min(width, height) * 0.11)

      // faint stars in the upper band
      for (let i = 0; i < 40; i += 1) {
        const sx = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * width
        const sy = Math.abs((Math.sin(i * 78.233) * 12543.21) % 1) * height * 0.35
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 2 + i)
        ctx.fillStyle = 'rgba(245,244,239,.5)'
        ctx.fillRect(sx, sy, 1.6, 1.6)
      }
      ctx.globalAlpha = 1

      // floating island, gently bobbing
      const bob = reducedMotion ? 0 : Math.sin(time * 0.8) * 10
      const islandSize = Math.min(width, height) * 0.09
      const islandX = width / 2 - width * 0.06 + parallaxX * 1.6
      const islandY = sunY - height * 0.22 + bob
      drawIsland(islandX, islandY, islandSize, 0.9)
      ctx.fillStyle = '#120a05'
      for (let i = 0; i < 4; i += 1) {
        const tx = islandX + (i - 1.5) * islandSize * 0.31
        const ty = islandY - islandSize * 0.22
        ctx.beginPath()
        ctx.moveTo(tx, ty - islandSize * 0.39)
        ctx.lineTo(tx - islandSize * 0.13, ty)
        ctx.lineTo(tx + islandSize * 0.13, ty)
        ctx.fill()
      }

      drawRidge(height * 0.62 - exit * 40, 34, 1.7, '#471708', 0.95)
      drawRidge(height * 0.7 - exit * 60, 44, 4.2, '#331006', 0.96)
      drawRidge(height * 0.8 - exit * 85, 56, 2.9, '#200a04', 0.98)
      drawRidge(height * 0.92 - exit * 110, 40, 5.5, '#120602', 1)

      // river catching the sunset
      const river = ctx.createLinearGradient(0, height * 0.62, 0, height)
      river.addColorStop(0, 'rgba(255,180,90,.28)')
      river.addColorStop(1, 'rgba(255,140,60,0)')
      ctx.fillStyle = river
      ctx.beginPath()
      ctx.moveTo(width / 2 - width * 0.03, height * 0.62)
      ctx.quadraticCurveTo(width / 2 + width * 0.05, height * 0.78, width / 2 - width * 0.015, height)
      ctx.lineTo(width / 2 + width * 0.05, height)
      ctx.quadraticCurveTo(width / 2 + width * 0.1, height * 0.76, width / 2 + width * 0.03, height * 0.62)
      ctx.closePath()
      ctx.fill()

      // rising embers
      for (const ember of embers) {
        if (!reducedMotion) {
          ember.y -= ember.speed * 0.0016
          ember.drift += 0.01
        }
        if (ember.y < -0.02) {
          ember.y = 1.02
          ember.x = Math.random()
        }
        const ex = (ember.x + Math.sin(ember.drift) * 0.015) * width
        const ey = ember.y * height - exit * height * 0.3
        ctx.globalAlpha = ember.alpha * (0.6 + 0.4 * Math.sin(time * 3 + ember.drift))
        ctx.fillStyle = '#ffb35c'
        ctx.beginPath()
        ctx.arc(ex, ey, ember.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ease the pointer parallax toward its target
      pointer.x += (pointer.targetX - pointer.x) * 0.05
      pointer.y += (pointer.targetY - pointer.y) * 0.05

      frameId = window.requestAnimationFrame(render)
    }

    resize()
    render()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
