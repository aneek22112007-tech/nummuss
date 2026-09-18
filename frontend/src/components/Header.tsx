import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FlipButton } from './ui/FlipButton'
import { scrollToId } from '../lib/useSmoothScroll'
import { useAuth } from '../lib/auth'

type Props = {
  onOpenMenu: () => void
  menuOpen: boolean
  onSignIn: () => void
}

export function Header({ onOpenMenu, menuOpen, onSignIn }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

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

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
  }

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
        
        {/* Show Sign In button when not authenticated */}
        {!isAuthenticated && (
          <FlipButton onClick={onSignIn} variant="mint">
            Sign In
          </FlipButton>
        )}
        
        {/* User menu when authenticated */}
        {isAuthenticated && user && (
          <div className="relative ml-2">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-full border border-snow/25 bg-snow/5 px-3 py-2 transition-colors hover:bg-snow/10"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-mint text-xs font-bold text-charcoal">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-snow">{user.name.split(' ')[0]}</span>
              <svg
                className={`h-4 w-4 text-snow/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-snow/10 bg-charcoal-soft/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="border-b border-snow/10 px-4 py-3">
                    <div className="text-sm font-medium text-snow">{user.name}</div>
                    <div className="text-xs text-snow/50">{user.email}</div>
                  </div>
                  <div className="p-2">
                    <a
                      href="#counterfactual"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToId('#counterfactual')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-snow/80 transition-colors hover:bg-snow/5"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Dashboard
                    </a>
                    <a
                      href="#replay"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToId('#replay')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-snow/80 transition-colors hover:bg-snow/5"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Replays
                    </a>
                  </div>
                  <div className="border-t border-snow/10 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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
