/**
 * Renders the hero camera move to real video files.
 *
 * The hero is a scroll-scrubbed sequence, so it needs a *seekable* video rather
 * than an animated canvas. This script rasterises the same scene the canvas
 * fallback paints — sky, retro sun, layered ridges, river, floating island,
 * rising embers and the opening cave mouth — one frame at a time, then pipes
 * raw RGB frames into ffmpeg.
 *
 * No image libraries required: frames go straight to ffmpeg's stdin as
 * `rawvideo`, which keeps this reproducible on any machine with ffmpeg.
 *
 * Usage: npm run render:hero
 *
 * Produced (public/hero/):
 *   hero-1600.mp4 / .webm   desktop master, all-GOP-friendly for scrubbing
 *   hero-960.mp4            lighter variant for narrow viewports
 *   poster.jpg              first frame, shown before the video is ready
 */

import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'hero')

const FPS = 30
const DURATION = 10 // seconds of camera move
const FRAMES = FPS * DURATION
const WIDTH = 1600
const HEIGHT = 900
const MOBILE_WIDTH = 960
const MOBILE_HEIGHT = 540

// ---------------------------------------------------------------- helpers

/** Deterministic RNG so every render is identical. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t

/** Blend `src` over `dst` with alpha. */
function blend(buf, index, r, g, b, alpha) {
  if (alpha <= 0) return
  if (alpha >= 1) {
    buf[index] = r
    buf[index + 1] = g
    buf[index + 2] = b
    return
  }
  buf[index] = buf[index] + (r - buf[index]) * alpha
  buf[index + 1] = buf[index + 1] + (g - buf[index + 1]) * alpha
  buf[index + 2] = buf[index + 2] + (b - buf[index + 2]) * alpha
}

// ---------------------------------------------------------------- scene

const rand = mulberry32(20260918)

/** star field, in normalised coords */
const STARS = Array.from({ length: 46 }, () => ({
  x: rand(),
  y: rand() * 0.35,
  size: rand() < 0.85 ? 1 : 2,
  phase: rand() * Math.PI * 2,
}))

/** floating embers rising through the frame */
const EMBERS = Array.from({ length: 70 }, () => ({
  x: rand(),
  y: rand(),
  radius: rand() * 2.4 + 0.7,
  speed: rand() * 0.45 + 0.12,
  drift: rand() * Math.PI * 2,
  alpha: rand() * 0.5 + 0.2,
}))

/** ridge layers, far → near. `base` is a fraction of the frame height. */
const RIDGE_LAYERS = [
  { base: 0.6, amp: 32, seed: 1.7, color: [71, 23, 8], push: 0.1 },
  { base: 0.69, amp: 42, seed: 4.2, color: [51, 16, 6], push: 0.17 },
  { base: 0.79, amp: 54, seed: 2.9, color: [32, 10, 4], push: 0.26 },
  { base: 0.91, amp: 38, seed: 5.5, color: [18, 6, 2], push: 0.36 },
]

/** drifting fog bands sitting on the horizon */
const FOG_BANDS = [
  { y: 0.6, height: 0.035, speed: 0.05, alpha: 0.09 },
  { y: 0.68, height: 0.028, speed: -0.035, alpha: 0.07 },
  { y: 0.77, height: 0.022, speed: 0.026, alpha: 0.05 },
]

/**
 * Paints one frame.
 * @param {Uint8Array} buf rgb24 buffer
 * @param {number} p camera progress 0 → 1
 * @param {number} time seconds
 * @param {number} w frame width
 * @param {number} h frame height
 * @param {Float32Array} vignette prepared per-pixel radial mask
 */
function renderFrame(buf, p, time, w, h, vignette) {
  const horizon = 0.85 // sky gradient stops, as fractions of height
  const easeOut = p * p * (3 - 2 * p)

  // ---- sky ------------------------------------------------------------
  const skyStops = [
    { at: 0, color: [22, 13, 10] },
    { at: 0.4, color: [61, 22, 12] },
    { at: 0.68, color: [166, 61, 26] },
    { at: 0.85, color: [224, 116, 47] },
    { at: 1, color: [242, 156, 74] },
  ]
  for (let y = 0; y < h; y += 1) {
    const t = y / h
    let lo = skyStops[0]
    let hi = skyStops[skyStops.length - 1]
    for (let i = 0; i < skyStops.length - 1; i += 1) {
      if (t >= skyStops[i].at && t <= skyStops[i + 1].at) {
        lo = skyStops[i]
        hi = skyStops[i + 1]
        break
      }
    }
    const span = hi.at - lo.at || 1
    const k = clamp01((t - lo.at) / span)
    // the sky warms slightly as the camera pushes toward the sun
    const r = lerp(lo.color[0], hi.color[0], k) + 8 * easeOut
    const g = lerp(lo.color[1], hi.color[1], k) + 12 * easeOut
    const b = lerp(lo.color[2], hi.color[2], k) + 16 * easeOut
    const rowStart = y * w * 3
    for (let x = 0; x < w; x += 1) {
      const i = rowStart + x * 3
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
    }
  }

  // ---- stars (fade out as day breaks toward the end) --------------------
  const starAlpha = (1 - easeOut) * 0.55
  for (const star of STARS) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * 2 + star.phase)
    const sx = Math.round(star.x * w)
    const sy = Math.round((star.y - easeOut * 0.04) * h)
    const size = star.size
    for (let dy = 0; dy < size; dy += 1) {
      for (let dx = 0; dx < size; dx += 1) {
        const px = sx + dx
        const py = sy + dy
        if (px < 0 || py < 0 || px >= w || py >= h) continue
        blend(buf, (py * w + px) * 3, 245, 244, 239, starAlpha * twinkle)
      }
    }
  }

  // ---- sun ------------------------------------------------------------
  // the camera dollies toward the sun: it grows, rises and brightens
  const sunRadius = h * lerp(0.085, 0.205, easeOut)
  const sunX = w / 2 + Math.sin(time * 0.12) * w * 0.006
  const sunY = h * lerp(0.5, 0.375, easeOut)

  const glowRadius = sunRadius * 3.4
  const gx0 = Math.max(0, Math.floor(sunX - glowRadius))
  const gx1 = Math.min(w - 1, Math.ceil(sunX + glowRadius))
  const gy0 = Math.max(0, Math.floor(sunY - glowRadius))
  const gy1 = Math.min(h - 1, Math.ceil(sunY + glowRadius))
  const inner = Math.max(1, sunRadius * 0.16)

  for (let y = gy0; y <= gy1; y += 1) {
    for (let x = gx0; x <= gx1; x += 1) {
      const dx = x - sunX
      const dy = y - sunY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > glowRadius) continue

      // cyan-free warm halo that tightens as the camera approaches
      const falloff = 1 - clamp01((dist - inner) / (glowRadius - inner))
      const alpha = Math.pow(falloff, 2.1) * lerp(0.72, 0.95, easeOut)
      const r = lerp(255, 255, falloff)
      const g = lerp(120, 210, falloff)
      const b = lerp(48, 120, falloff)
      blend(buf, (y * w + x) * 3, r, g, b, alpha)

      // the disc itself + retro scanline slices across its lower half
      if (dist <= sunRadius) {
        const scan = y - (sunY + sunRadius * 0.12)
        let blocked = false
        if (scan > 0) {
          const step = sunRadius * 0.155
          const index = Math.floor(scan / step)
          const thickness = (step * 0.22) * (1 + index * 0.24)
          blocked = scan - index * step < thickness
        }
        if (!blocked) {
          blend(buf, (y * w + x) * 3, 255, 232, 150, 1)
        } else {
          blend(buf, (y * w + x) * 3, 11, 13, 12, 0.9)
        }
      }
    }
  }

  const scan = sunY + sunRadius * 0.12

  // ---- floating island (we fly past it) --------------------------------
  const islandAlpha = clamp01(1 - easeOut * 1.1)
  if (islandAlpha > 0.01) {
    const bob = Math.sin(time * 0.7) * h * 0.012
    const size = h * lerp(0.1, 0.16, easeOut)
    // sits inside the sun's halo so it reads as a silhouette, then drifts up
    // and out of frame as the camera pushes past it
    const cx = w * 0.4 - w * 0.07 * easeOut
    const cy = h * (0.31 - 0.17 * easeOut) + bob
    const x0 = Math.max(0, Math.floor(cx - size * 1.2))
    const x1 = Math.min(w - 1, Math.ceil(cx + size * 1.2))
    const y0 = Math.max(0, Math.floor(cy - size * 0.5))
    const y1 = Math.min(h - 1, Math.ceil(cy + size * 0.9))

    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const nx = (x - cx) / size
        const ny = (y - cy) / (size * 0.34)
        // squashed ellipse for the land mass
        if (nx * nx + ny * ny <= 1) {
          // warm rim light where the sun grazes the upper edge
          const rim = clamp01(-ny) * 0.85 + clamp01(nx + 0.4) * 0.15
          if (rim > 0.72) {
            blend(buf, (y * w + x) * 3, 255, 186, 116, islandAlpha * (rim - 0.72) * 2.4)
          } else {
            blend(buf, (y * w + x) * 3, 24, 14, 8, islandAlpha * 0.96)
          }
          continue
        }
        // two tapering rock spikes beneath
        const spike = (offsetX, width) => {
          const t = (y - cy) / (size * 0.85)
          if (t < 0 || t > 1) return false
          const halfWidth = width * (1 - t)
          return Math.abs(x - (cx + offsetX)) <= halfWidth
        }
        if (spike(-size * 0.32, size * 0.2) || spike(size * 0.2, size * 0.26)) {
          blend(buf, (y * w + x) * 3, 22, 12, 7, islandAlpha * 0.96)
        }
      }
    }

    // five conifers on top
    for (let i = 0; i < 5; i += 1) {
      const tx = cx + (i - 2) * size * 0.3
      const baseY = cy - size * 0.18
      const topY = baseY - size * 0.5
      const halfBase = size * 0.11
      for (let y = Math.max(0, Math.floor(topY)); y <= Math.min(h - 1, Math.ceil(baseY)); y += 1) {
        const t = (y - topY) / (baseY - topY || 1)
        const half = halfBase * t
        for (let x = Math.floor(tx - half); x <= Math.ceil(tx + half); x += 1) {
          if (x < 0 || x >= w) continue
          blend(buf, (y * w + x) * 3, 18, 10, 5, islandAlpha)
        }
      }
    }
  }

  // ---- ridges, far → near ---------------------------------------------
  for (let layerIndex = 0; layerIndex < RIDGE_LAYERS.length; layerIndex += 1) {
    const layer = RIDGE_LAYERS[layerIndex]
    const baseY = (layer.base + layer.push * easeOut * 1.5) * h
    const amp = layer.amp * (1 + easeOut * 1.05)
    const [r, g, b] = layer.color
    const columns = new Float32Array(w)
    for (let x = 0; x < w; x += 1) {
      columns[x] =
        baseY +
        Math.sin(x * 0.006 + layer.seed) * amp +
        Math.sin(x * 0.017 + layer.seed * 2.7) * amp * 0.4 +
        Math.sin(x * 0.041 + layer.seed * 1.3) * amp * 0.15
    }
    for (let x = 0; x < w; x += 1) {
      const from = Math.max(0, Math.floor(columns[x]))
      for (let y = from; y < h; y += 1) {
        const i = (y * w + x) * 3
        buf[i] = r
        buf[i + 1] = g
        buf[i + 2] = b
      }
    }
  }

  // ---- fog bands on the horizon (drifting, adds per-frame motion) -------
  for (const band of FOG_BANDS) {
    const centreY = band.y * h + easeOut * h * 0.1
    const halfHeight = band.height * h
    const y0 = Math.max(0, Math.floor(centreY - halfHeight))
    const y1 = Math.min(h - 1, Math.ceil(centreY + halfHeight))
    for (let y = y0; y <= y1; y += 1) {
      const ty = 1 - Math.abs(y - centreY) / halfHeight
      for (let x = 0; x < w; x += 1) {
        const wave = Math.sin(x * 0.004 + time * band.speed * 6 + band.y * 10)
        const alpha = band.alpha * ty * (0.55 + 0.45 * wave) * (1 - easeOut * 0.35)
        if (alpha > 0.002) blend(buf, (y * w + x) * 3, 255, 196, 140, alpha)
      }
    }
  }

  // ---- river catching the sunset ---------------------------------------
  const riverAlpha = lerp(0.28, 0.42, easeOut)
  for (let y = Math.floor(h * 0.6); y < h; y += 1) {
    const t = (y - h * 0.6) / (h * 0.4)
    const centre = w / 2 + Math.sin(t * 2.2) * w * 0.028 - w * 0.004 * easeOut
    const halfWidth = lerp(w * 0.028, w * 0.062, t)
    const alpha = riverAlpha * (1 - t) * (0.65 + 0.35 * Math.sin(y * 0.22 + time * 1.4))
    const x0 = Math.max(0, Math.floor(centre - halfWidth))
    const x1 = Math.min(w - 1, Math.ceil(centre + halfWidth))
    for (let x = x0; x <= x1; x += 1) {
      blend(buf, (y * w + x) * 3, 255, 176, 92, Math.max(0, alpha))
    }
  }

  // ---- embers ----------------------------------------------------------
  for (const ember of EMBERS) {
    const travel = (ember.y - ember.speed * time * 0.05 + 1) % 1
    const ex = (ember.x + Math.sin(ember.drift + time * 0.6) * 0.015) * w
    const ey = travel * h - easeOut * h * 0.18
    const radius = ember.radius * (1 + easeOut * 0.8)
    const alpha = ember.alpha * (0.6 + 0.4 * Math.sin(time * 3 + ember.drift))
    const x0 = Math.max(0, Math.floor(ex - radius - 1))
    const x1 = Math.min(w - 1, Math.ceil(ex + radius + 1))
    const y0 = Math.max(0, Math.floor(ey - radius - 1))
    const y1 = Math.min(h - 1, Math.ceil(ey + radius + 1))
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = x - ex
        const dy = y - ey
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > radius) continue
        blend(buf, (y * w + x) * 3, 255, 179, 92, alpha * (1 - d / radius))
      }
    }
  }

  // ---- foreground valley lip: the near ridge we rise over ---------------
  const lipTop = h * lerp(1.06, 0.99, easeOut)
  for (let x = 0; x < w; x += 1) {
    const wobble =
      Math.sin(x * 0.009 + 3.1) * h * 0.022 + Math.sin(x * 0.023 + 1.4) * h * 0.01
    const from = Math.max(0, Math.floor(lipTop + wobble))
    for (let y = from; y < h; y += 1) {
      const i = (y * w + x) * 3
      buf[i] = 12
      buf[i + 1] = 4
      buf[i + 2] = 1
    }
  }

  // ---- cave-mouth vignette ---------------------------------------------
  // Heavy dark arch at the start (we are inside the cave mouth), opening up
  // into full daylight as the camera pushes through it.
  const innerR = lerp(0.22, 0.84, easeOut)
  const outerR = lerp(0.76, 1.6, easeOut)
  const strength = lerp(0.97, 0.82, easeOut)
  for (let i = 0, px = 0; px < w * h; px += 1, i += 3) {
    const d = vignette[px]
    if (d <= innerR) continue
    const k = clamp01((d - innerR) / (outerR - innerR))
    const mul = 1 - k * strength
    buf[i] *= mul
    buf[i + 1] *= mul
    buf[i + 2] *= mul
  }

  // keep the scanline reference used above meaningful for linters
  void scan
}

/** Normalised radial distance map for the vignette (computed once per size). */
function buildVignette(w, h) {
  const map = new Float32Array(w * h)
  const cx = w / 2
  const cy = h * 0.46
  const maxDist = Math.hypot(w / 2, h / 2)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      map[y * w + x] = Math.hypot(x - cx, y - cy) / maxDist
    }
  }
  return map
}

// ---------------------------------------------------------------- encoding

async function ffmpegEncode({ w, h, frames, output, args }) {
  const ff = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-s',
      `${w}x${h}`,
      '-r',
      String(FPS),
      '-i',
      'pipe:0',
      ...args,
      output,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )

  const finished = new Promise((resolvePromise, rejectPromise) => {
    ff.on('error', rejectPromise)
    ff.on('close', (code) =>
      code === 0 ? resolvePromise() : rejectPromise(new Error(`ffmpeg exited ${code}`)),
    )
  })

  const vignette = buildVignette(w, h)
  const frameBytes = w * h * 3

  for (let frame = 0; frame < frames; frame += 1) {
    const p = frames === 1 ? 0 : frame / (frames - 1)
    const time = frame / FPS

    // A FRESH buffer per frame is essential: `stdin.write()` only queues the
    // buffer (it is not copied), so reusing one allocation would let the next
    // frame overwrite data ffmpeg has not consumed yet — every encoded frame
    // would drift toward the last rendered one.
    const pixels = new Uint8Array(frameBytes)
    renderFrame(pixels, p, time, w, h, vignette)

    // honour backpressure so we never queue hundreds of frames in memory
    if (!ff.stdin.write(pixels)) await once(ff.stdin, 'drain')
  }

  ff.stdin.end()
  await finished
}

// ---------------------------------------------------------------- main

await mkdir(OUT_DIR, { recursive: true })

const jobs = [
  {
    label: `hero-1600.mp4 (${WIDTH}x${HEIGHT}, ${FRAMES} frames)`,
    w: WIDTH,
    h: HEIGHT,
    frames: FRAMES,
    output: join(OUT_DIR, 'hero-1600.mp4'),
    args: [
      '-c:v',
      'libx264',
      '-preset',
      'veryslow',
      '-crf',
      '21',
      '-pix_fmt',
      'yuv420p',
      // short GOP: scrubbing seeks constantly, keyframes keep that instant
      '-g',
      '6',
      '-keyint_min',
      '6',
      '-sc_threshold',
      '0',
      '-movflags',
      '+faststart',
    ],
  },
  {
    label: 'hero-1600.webm (VP9)',
    w: WIDTH,
    h: HEIGHT,
    frames: FRAMES,
    output: join(OUT_DIR, 'hero-1600.webm'),
    args: [
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '33',
      '-b:v',
      '0',
      '-row-mt',
      '1',
      '-g',
      '6',
      '-pix_fmt',
      'yuv420p',
    ],
  },
  {
    label: `hero-960.mp4 (${MOBILE_WIDTH}x${MOBILE_HEIGHT})`,
    w: MOBILE_WIDTH,
    h: MOBILE_HEIGHT,
    frames: FRAMES,
    output: join(OUT_DIR, 'hero-960.mp4'),
    args: [
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-g',
      '6',
      '-movflags',
      '+faststart',
    ],
  },
]

for (const job of jobs) {
  const started = Date.now()
  process.stdout.write(`rendering ${job.label} … `)
  await ffmpegEncode(job)
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  process.stdout.write(`done in ${seconds}s\n`)
}

// poster: first frame of the desktop master
await new Promise((resolvePromise, rejectPromise) => {
  const ff = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      join(OUT_DIR, 'hero-1600.mp4'),
      '-frames:v',
      '1',
      '-q:v',
      '4',
      join(OUT_DIR, 'poster.jpg'),
    ],
    { stdio: 'inherit' },
  )
  ff.on('error', rejectPromise)
  ff.on('close', (code) =>
    code === 0 ? resolvePromise() : rejectPromise(new Error(`poster ffmpeg exited ${code}`)),
  )
})

process.stdout.write('✓ hero video assets written to public/hero/\n')
