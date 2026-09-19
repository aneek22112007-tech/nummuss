/**
 * NUMMUSS Application Shell
 * Global layout with persistent sidebar and top bar
 * This wraps all product pages (NOT the landing page)
 */

import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuth } from '../lib/auth'

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()

  // Wait for auth to initialize before rendering or redirecting
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0d0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    )
  }

  // Redirect to landing page if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen bg-[#0b0d0c] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Application Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
