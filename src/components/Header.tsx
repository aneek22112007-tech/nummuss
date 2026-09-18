import { useEffect, useState } from 'react'
import { FlipButton } from './ui/FlipButton'
import { scrollToId } from '../lib/useSmoothScroll'

type Props = {
  onOpenMenu: () => void
  menuOpen: boolean
}

export function Header({ onOpenMenu, menuOpen }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > last && y > 300 && !menuOpen)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [menuOpen])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-[clamp(20px,4vw,64px)] py-4',
        'transition-[transform,background-color,border-color] duration-500',
        'border-b',
        scrolled ? 'border-snow/10 bg-charcoal/70 backdrop-blur-xl' : 'border-transparent',
        hidden ? '-translate-y-[110%]' : 'translate-y-0',
      ].join(' ')}
    >
      <a
        href="#top"
        className="group flex items-center gap-3 font-display text-xl uppercase tracking-[0.06em]"
        onClick={(event) => {
          event.preventDefault()
          scrollToId('#top')
        }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-mint text-lg text-charcoal transition-transform duration-500 group-hover:-rotate-8 group-hover:scale-105">
          N
        </span>
        <span>Nummuss</span>
      </a>

      {/* pr-20 keeps the links clear of the fixed burger button on large screens */}
      <nav className="hidden items-center gap-2 pr-20 lg:flex">
        <FlipButton href="#experiment">The Experiment</FlipButton>
        <FlipButton href="#gates">Safety Gates</FlipButton>
        <FlipButton href="#replay">India Replay</FlipButton>
        <FlipButton href="#shadow" variant="mint">
          Try /shadow
        </FlipButton>
      </nav>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="fixed top-4 right-4 z-50 grid h-13 w-13 place-items-center rounded-[14px] bg-snow text-charcoal transition-transform duration-300 hover:scale-106"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M1 4H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M1 10L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M1 16L19 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}
