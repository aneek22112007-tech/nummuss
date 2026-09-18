/**
 * NUMMUSS Sidebar
 * Premium compact navigation with system status
 */

import { NavLink } from 'react-router-dom'

const navigation = [
  { name: 'OVERVIEW', path: '/dashboard' },
  { name: 'EXPERIMENT', path: '/experiment' },
  { name: 'DECISIONS', path: '/decisions' },
  { name: 'COUNTERFACTUAL', path: '/counterfactual' },
  { name: 'INDIA REPLAY', path: '/replay' },
  { name: 'BEHAVIORAL RISK', path: '/risk' },
  { name: 'SECURITY', path: '/security' },
  { name: 'SHADOW LAB', path: '/shadow' },
  { name: 'EVIDENCE', path: '/evidence' },
  { name: 'SYSTEM', path: '/system' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#111412] border-r border-snow/10 flex flex-col">
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
                  `block px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-amber/10 text-amber border-l-2 border-amber pl-[10px]'
                      : 'text-snow/60 hover:text-snow hover:bg-snow/5'
                  }`
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-snow/10">
        <div className="flex items-center gap-2 mb-2">
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
