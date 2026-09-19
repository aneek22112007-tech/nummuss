/**
 * NUMMUSS Sidebar
 * Premium compact navigation with system status
 */

import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'


const navigation = [
  { name: 'OVERVIEW', path: '/dashboard' },
  { name: 'SHADOW LAB', path: '/shadow', featured: true },
  { name: 'EXPERIMENT', path: '/experiment' },
  { name: 'DECISIONS', path: '/decisions' },
  { name: 'COUNTERFACTUAL', path: '/counterfactual' },
  { name: 'INDIA REPLAY', path: '/replay' },
  { name: 'BEHAVIORAL RISK', path: '/risk' },
  { name: 'SECURITY', path: '/security' },
  { name: 'EVIDENCE', path: '/evidence' },
  { name: 'SYSTEM', path: '/system' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  
  return (
    <aside className="w-[280px] m-4 rounded-[32px] glass-panel flex flex-col overflow-hidden relative">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-snow/10">
        <div className="mb-1">
          <h1 className="text-xl font-display text-snow tracking-wide">NUMMUSS</h1>
        </div>
        <p className="text-[10px] text-snow/40 uppercase tracking-widest leading-tight">
          BEHAVIORAL SAFETY<br />
          FOR AI TRADING AGENTS
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 mx-3 mb-1.5 rounded-2xl text-[13px] font-medium tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : item.featured
                      ? 'text-snow/80 hover:text-snow hover:bg-white/5'
                      : 'text-snow/60 hover:text-snow hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  {item.featured && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-snow/40" />
                    </span>
                  )}
                  <span>{item.name}</span>
                </div>
                {item.featured && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-snow/10 text-snow/60 tracking-wider">
                    FLAGSHIP
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      {user && (
        <div className="px-4 py-3 mx-4 my-4 rounded-[20px] bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="h-6 w-6 rounded-full" />
            ) : (
              <div className="grid h-6 w-6 place-items-center rounded-full bg-mint text-[10px] font-bold text-charcoal">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-snow truncate">{user.name.split(' ')[0]}</span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="text-snow/40 hover:text-danger transition-colors p-1"
            title="Sign Out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}

      {/* System Status */}
      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
          <span className="text-xs text-mint font-medium">SYSTEM OPERATIONAL</span>
        </div>
        <p className="text-[10px] text-snow/40 uppercase tracking-wider">
          SIMULATION ONLY
        </p>
      </div>
    </aside>
  )
}
