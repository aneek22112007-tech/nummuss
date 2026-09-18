import { useState, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { AuthProvider, useAuth } from './lib/auth'
import { Header } from './components/Header'
import { NavOverlay } from './components/NavOverlay'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { Vision } from './components/Vision'
import { Stats } from './components/Stats'
import { Problems } from './components/Problems'
import { Pipeline } from './components/Pipeline'
import { Gates } from './components/Gates'
import { SecurityVerification } from './components/SecurityVerification'
import { Counterfactual } from './components/Counterfactual'
import { FailureModes } from './components/FailureModes'
import { Replay } from './components/Replay'
import { Shadow } from './components/Shadow'
import { FinalCTA } from './components/FinalCTA'
import { Footer } from './components/Footer'
import { AuthPage } from './components/AuthPage'
import { Toast } from './components/ui/Toast'
import { useSmoothScroll } from './lib/useSmoothScroll'

/**
 * Nummuss landing page.
 *
 * Section order is a 1:1 match with bitcoinos.build — hero scene, marquee,
 * vision, evidence, positioning rows, pinned "how it works" pipeline, feature
 * gates, the counterfactual proof, failure modes, the horizontally-scrubbed
 * India Replay rail, the shadow challenge, and the oversized footer wordmark.
 * All copy comes from the Nummuss PRD v5.0.
 */
function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSignUpOpen, setSignUpOpen] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Lenis inertia scrolling, synced to the GSAP ScrollTrigger ticker
  useSmoothScroll()

  // Show welcome toast when user logs in
  useEffect(() => {
    if (isAuthenticated && user && !isSignUpOpen) {
      setShowWelcomeToast(true)
    }
  }, [isAuthenticated, user, isSignUpOpen])

  const handleAuthClose = () => {
    setSignUpOpen(false)
    // Small delay to ensure auth state is updated
    setTimeout(() => {
      if (isAuthenticated && user) {
        setShowWelcomeToast(true)
      }
    }, 100)
  }

  return (
    <div className="relative overflow-x-clip">
      <Header 
        onOpenMenu={() => setMenuOpen(true)} 
        menuOpen={menuOpen}
        onSignIn={() => setSignUpOpen(true)}
      />
      <NavOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main>
        <Hero onTryClick={() => setSignUpOpen(true)} />
        <Marquee />
        <Vision />
        <Stats />
        <Problems />
        <Pipeline />
        <Gates />
        <SecurityVerification />
        <Counterfactual />
        <FailureModes />
        <Replay />
        <Shadow />
        <FinalCTA />
      </main>

      <Footer />

      <AnimatePresence>
        {isSignUpOpen && <AuthPage onBack={handleAuthClose} />}
      </AnimatePresence>

      <Toast
        show={showWelcomeToast}
        message={`Welcome${user ? `, ${user.name.split(' ')[0]}` : ''}! You're now signed in.`}
        type="success"
        onClose={() => setShowWelcomeToast(false)}
        duration={4000}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
