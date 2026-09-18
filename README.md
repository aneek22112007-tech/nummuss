# Nummuss — Landing Page

A **React + TypeScript** rebuild of the [bitcoinos.build](https://bitcoinos.build/?ref=landing.love) landing
experience — same structure, same scroll choreography, same image-swap behaviour — with every
word replaced by the **Nummuss PRD v5.0** content.

> Simulation only · No real capital · Not investment advice.

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **React 18 + TypeScript** (strict) | componentised sections, typed content layer |
| Build | **Vite 6** | instant HMR, tiny config |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | design tokens live in `src/index.css` via `@theme` |
| Smooth scrolling | **Lenis** | the inertia feel the reference site has |
| Scroll choreography | **GSAP + ScrollTrigger** | pinned/scrubbed sections (pipeline, horizontal rail, footer wordmark) |
| Entrance & UI motion | **Motion** (`motion/react`) | line-by-line headline reveals, staggered cards, path drawing, menu clip-path |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build           # typecheck + production build into dist/
npm run typecheck       # tsc -b, no emit
npm run preview         # serve the production build
npm run build:preview   # inline dist/ into one file: preview/nummuss-landing.html
```

`build:preview` exists so the whole page can be opened straight from disk (or screen-recorded)
without a server. It is not part of the deployment path. Pass `--inline-video` to embed the hero
clip as a data URI too, which makes the single file fully offline (≈5 MB).

## How it maps onto the reference site

| Reference section | Nummuss section | Component |
| --- | --- | --- |
| Hero filmed camera move + headline + "Join the Revolution" | Scroll-scrubbed hero video, "Discipline, Enforce the Trade", CTAs | `Hero.tsx` + `ScrollVideo.tsx` (canvas fallback in `HeroCanvas.tsx`) |
| Ticker strip | Failure-mode marquee | `Marquee.tsx` |
| `[ Vision ]` | `[ Vision ] Enforce the Discipline` | `Vision.tsx` |
| Mission statement | FY26 SEBI evidence + outlined `87.7%` numeral | `Stats.tsx` |
| "…was underutilized" rows | Positioning rows with animated strike-through | `Problems.tsx` |
| `[ How it works ] A NEW WORLD UNFOLDS` (pinned) | `One Signal. Two Agents. Three Gates.` pinned pipeline | `Pipeline.tsx` |
| Feature cards | Layer 0 / 1 / 2 safety gates | `Gates.tsx` |
| Counterfactual proof | Twin ledger + self-drawing curve chart | `Counterfactual.tsx` |
| Feature accordion | Documented failure modes | `FailureModes.tsx` |
| Horizontal panel scrub | India Replay scenario rail | `Replay.tsx` |
| — | `POST /shadow` typewriter terminal | `Shadow.tsx` |
| Community cards + giant `BOS` wordmark + newsletter | Community cards + giant `NUMMUSS` wordmark + newsletter | `Footer.tsx` |
| Fullscreen burger menu with image swap | Same, numbered Product/Company groups | `NavOverlay.tsx` |

## The hero video

The opening scene is a real video that is **driven by scroll, not played**. A 10-second camera move
travels through a cave mouth toward a retro sun while a floating island drifts out of frame.

```bash
npm run render:hero     # regenerate public/hero/* (needs ffmpeg on PATH)
```

`scripts/render-hero-video.mjs` rasterises every frame in plain Node — sky gradient, sun with
scanline slices, four ridge layers, drifting fog, river, island and embers — and pipes raw RGB
frames straight into ffmpeg (no image libraries, no native deps). It emits:

| File | Size | Purpose |
| --- | --- | --- |
| `hero-1600.mp4` | 1.9 MB | H.264 master, 1600×900, `-g 6` + faststart for fast seeking |
| `hero-1600.webm` | 1.0 MB | VP9 alternative (picked first when supported) |
| `hero-960.mp4` | 787 kB | narrow-viewport cut |
| `poster.jpg` | 22 kB | first frame, shown before the clip is ready |

They are committed, so a plain `npm install && npm run build` needs no ffmpeg.

### How the scrub works (`src/components/ScrollVideo.tsx`)

- the hero section is **220svh tall with a sticky stage**, giving the clip ~1.2 screens of scroll
  distance;
- one `requestAnimationFrame` loop reads the section's progress and **eases `currentTime` toward
  `progress × duration`** (0.18 weight) so fast flicks do not snap the camera;
- writes are skipped while `video.seeking` is true, and sub-frame deltas (< 1/60 s) are ignored;
- the same loop drives `onProgress`, which lifts and fades the headline copy so the artwork owns
  the second half of the scrub;
- **touch devices** get the clip on a muted loop instead — mobile browsers throttle and sometimes
  refuse repeated programmatic seeks;
- `prefers-reduced-motion` holds a still frame;
- if the file cannot load (offline, unsupported codec) the `error` handler swaps in the canvas
  painter, so the hero is never an empty box.

## Animation inventory

- **Hero scene** — scroll-scrubbed video (above), with the canvas painter as fallback.
- **Lenis + ScrollTrigger** — Lenis drives native scroll and pushes every frame into GSAP's ticker,
  so scrubbed timelines stay frame-perfect.
- **Pinned pipeline** (`Pipeline.tsx`) — a tall wrapper + CSS sticky child; ScrollTrigger's
  `onUpdate` toggles node classes and swaps the side image *imperatively* (no React re-render
  during scrub).
- **Horizontal rail** (`Replay.tsx`) — vertical scroll converted into `x` translation with
  `scrub: 0.6` and `invalidateOnRefresh` so it recalculates on resize.
- **Self-drawing chart** — Motion's `pathLength` animates both twin curves into view.
- **Reveals** — `SplitHeading` masks each headline line and slides it up; `Reveal` fades blocks in;
  `BracketLabel` reveals letter by letter.
- **Nav overlay** — Motion tweens `clipPath: circle()` from the burger button.

## Project layout

```
src/
  App.tsx                 # section order (mirrors the reference page)
  index.css               # Tailwind theme tokens + primitives
  data/content.ts         # ALL copy, typed — edit here, not in components
  lib/                    # useSmoothScroll, useInView, usePrefersReducedMotion
  components/
    ui/                   # FlipButton, BracketLabel, Reveal, SplitHeading, Emphasized
    ScrollVideo.tsx       # scroll-scrubbed <video> (the hero)
    HeroCanvas.tsx        # canvas fallback if the video cannot load
    ...sections
public/hero/              # generated video assets (committed)
scripts/
  render-hero-video.mjs   # rasterise + encode the hero camera move
  build-preview.mjs       # inline dist/ into a single HTML file
legacy/static-landing.html# first-pass static version, kept for reference
```

## Content rules baked into the copy

The landing page deliberately avoids claims the PRD rules out:

- it never says "we saved traders ₹X" — only "in this controlled replay, the disciplined agent
  avoided ₹18,400 of simulated exposure";
- Guardrails are described as **separately metered**, never "free";
- live paper, India Replay and security-test rows are always visually labelled;
- the twin is described as a **controlled simulation profile**, not a population model.

## Credits

Copy derived from *Nummuss — Final PRD v5.0 (First Commit 2026, AWS Ship It)*.
Layout and motion language inspired by the BitcoinOS landing page.
Imagery uses Unsplash placeholders — swap the URLs in `src/data/content.ts` for your own renders.
