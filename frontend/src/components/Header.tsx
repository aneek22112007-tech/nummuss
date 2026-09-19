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
        'transition-[transform,background-color,border-color,backdrop-filter] duration-500',
        scrolled 
          ? 'bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' 
          : 'bg-transparent border-b border-transparent',
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

      <nav className="hidden items-center gap-6 lg:flex">
        <div className="flex items-center gap-6">
          {[
            { href: '#shadow', label: 'Shadow Mode' },
            { href: '#experiment', label: 'The Experiment' },
            { href: '#gates', label: 'Safety Gates' },
            { href: '#replay', label: 'India Replay' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                scrollToId(link.href)
              }}
              className="text-[13px] font-medium text-snow/70 transition-colors hover:text-mint"
            >
              {link.label}
            </a>
          ))}
        </div>
        
        <div className="flex items-center ml-2">
          {/* Show Sign In button when not authenticated */}
          {!isAuthenticated && (
            <button
              onClick={onSignIn}
              className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 text-[13px] font-bold tracking-wide text-snow shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          )}
          
          {/* User menu when authenticated */}
          {isAuthenticated && user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-snow/25 bg-snow/5 px-3 py-1.5 transition-colors hover:bg-snow/10"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-mint text-[10px] font-bold text-charcoal">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-snow">{user.name.split(' ')[0]}</span>
                <svg
                  className={`h-3.5 w-3.5 text-snow/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
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
                    className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl"
                  >
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="text-xs font-medium text-snow">{user.name}</div>
                      <div className="text-[10px] text-snow/50 truncate">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <a
                        href="#counterfactual"
                        onClick={(e) => {
                          e.preventDefault()
                          scrollToId('#counterfactual')
                          setUserMenuOpen(false)
                        }}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-snow/80 transition-colors hover:bg-snow/5 hover:text-snow"
                      >
                        <svg className="h-3.5 w-3.5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-snow/80 transition-colors hover:bg-snow/5 hover:text-snow"
                      >
                        <svg className="h-3.5 w-3.5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Replays
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="fixed right-4 top-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-snow border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl transition-all duration-300 hover:bg-white/20 lg:hidden"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}
