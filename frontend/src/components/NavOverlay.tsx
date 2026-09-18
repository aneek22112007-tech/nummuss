import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { navSections, orbImages, type OrbKey } from '../data/content'
import { scrollToId, stopScroll } from '../lib/useSmoothScroll'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * The reference site's menu expands out of the burger button as a circle,
 * shows a large image on the left that swaps as you hover the numbered links,
 * and lists Product / Company groups. Rebuilt here with Motion's clipPath tween.
 */
export function NavOverlay({ open, onClose }: Props) {
  const [activeOrb, setActiveOrb] = useState<OrbKey>('reason')

  useEffect(() => {
    stopScroll(open)
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-45 grid grid-cols-1 bg-ink lg:grid-cols-[1fr_1.2fr]"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
            animate={{ clipPath: 'circle(142% at calc(100% - 44px) 44px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* media panel — image swaps with the hovered menu item */}
            <div className="relative m-[56px_0_0_28px] hidden overflow-hidden rounded-3xl lg:block">
              {Object.entries(orbImages).map(([key, src]) => (
                <img
                  key={key}
                  src={src}
                  alt=""
                  loading="lazy"
                  className={[
                    'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
                    key === activeOrb ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              ))}
              <div className="absolute inset-0 bg-charcoal/25" />
            </div>

            <nav className="overflow-y-auto px-[clamp(24px,6vw,90px)] pt-28 pb-10">
              {navSections.map((section) => (
                <div key={section.label} className="mb-9">
                  <span className="mb-3 block text-[13px] font-medium uppercase tracking-[0.14em] text-snow/40">
                    [&nbsp;{section.label}&nbsp;]
                  </span>
                  {section.items.map((item) => (
                    <a
                      key={item.num}
                      href={item.href}
                      onMouseEnter={() => setActiveOrb(item.orb)}
                      onFocus={() => setActiveOrb(item.orb)}
                      onClick={(event) => {
                        event.preventDefault()
                        onClose()
                        // let the overlay animate away before scrolling
                        window.setTimeout(() => scrollToId(item.href), 420)
                      }}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border-b border-snow/5 px-4 py-2.5 font-display text-[clamp(24px,3.4vw,40px)] uppercase leading-none transition-[background-color,padding] duration-300 hover:bg-snow/5 hover:pl-6"
                    >
                      <span className="min-w-6 text-xs text-snow/40">{item.num}</span>
                      <span>{item.title}</span>
                      <span className="ml-auto -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        &rarr;
                      </span>
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </motion.div>

          <motion.button
            key="close"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="fixed top-4 right-4 z-50 grid h-13 w-13 place-items-center rounded-[14px] bg-snow text-charcoal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>

          <motion.div
            key="socials"
            className="fixed right-7 bottom-7 z-50 flex gap-5 text-sm text-snow/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <a href="#" className="transition-colors hover:text-mint">
              GitHub
            </a>
            <a href="#" className="transition-colors hover:text-mint">
              X
            </a>
            <a href="#" className="transition-colors hover:text-mint">
              YouTube
            </a>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
