/**
 * Bundles `dist/` into one self-contained HTML file at `preview/nummuss-landing.html`.
 *
 * Why: the normal Vite build emits separate CSS/JS assets. For quick visual
 * checks (and for emailing/screen-recording the page without a server) it is
 * handy to have a single file with everything inlined. This does NOT replace
 * the real build — `npm run dev` / `npm run build` remain the source of truth.
 *
 * Usage: npm run build && npm run build:preview
 *        npm run build:preview -- --inline-video   (also embeds the hero clip)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const inlineVideo = process.argv.includes('--inline-video')

const root = resolve(import.meta.dirname, '..')
const distDir = join(root, 'dist')
const outFile = join(root, 'preview', 'nummuss-landing.html')

const html = await readFile(join(distDir, 'index.html'), 'utf8')

let inlined = html

// NOTE: always use a replacer *function* — bundle code contains `$&`/`$1`-style
// sequences that would otherwise be treated as replacement patterns.

// inline stylesheets
const styleLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
for (const [tag, href] of styleLinks) {
  const css = await readFile(join(distDir, href.replace(/^\.?\//, '')), 'utf8')
  inlined = inlined.replace(tag, () => `<style>\n${css}\n</style>`)
}

// inline module scripts (escape any accidental `</script>` inside the bundle)
// eslint-disable-next-line no-irregular-whitespace
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
for (const [tag, src] of scripts) {
  const js = (await readFile(join(distDir, src.replace(/^\.?\//, '')), 'utf8')).replace(
    /<\/script>/gi,
    '<\\/script>',
  )
  inlined = inlined.replace(tag, () => `<script type="module">\n${js}\n</script>`)
}

// ---------------------------------------------------------------- hero video
// Embedding the clip turns the preview into a genuinely offline file, which is
// handy for screen recordings. The normal build always streams it as a file.
if (inlineVideo) {
  const assets = [
    'hero/hero-1600.mp4',
    'hero/hero-960.mp4',
    'hero/hero-1600.webm',
    'hero/poster.jpg',
  ]
  const mime = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    jpg: 'image/jpeg',
  }

  for (const asset of assets) {
    if (!inlined.includes(asset)) continue
    const bytes = await readFile(join(root, 'public', asset))
    const ext = asset.split('.').pop()
    const dataUri = `data:${mime[ext]};base64,${bytes.toString('base64')}`
    inlined = inlined.split(`"${asset}"`).join(`"${dataUri}"`)
    console.log(`  embedded ${asset} (${Math.round(bytes.length / 1024)} kB)`)
  }
}

await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, inlined, 'utf8')

const kb = Math.round(Buffer.byteLength(inlined) / 1024)
console.log(`✓ single-file preview written: preview/nummuss-landing.html (${kb} kB)`)
