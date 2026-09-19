import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

// Product Application
import { AppShell } from './app/AppShell'
import Overview from './pages/Overview'
import Experiment from './pages/Experiment'
import Decisions from './pages/Decisions'
import DecisionDetail from './pages/DecisionDetail'
import CounterfactualPage from './pages/Counterfactual'
import IndiaReplay from './pages/IndiaReplay'
import BehavioralRisk from './pages/BehavioralRisk'
import SecurityPage from './pages/Security'
import ShadowLab from './pages/ShadowLab'
import EvidencePage from './pages/Evidence'
import SystemPage from './pages/System'

/**
 * Nummuss Application
 * 
 * Two distinct experiences:
 * 1. Landing Page (/) - Marketing/storytelling
 * 2. Product Application (/dashboard, /experiment, etc.) - Functional interface
 */
function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSignUpOpen, setSignUpOpen] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()

  // Lenis inertia scrolling for landing page only
  useSmoothScroll()

  const handleAuthClose = () => {
    setSignUpOpen(false)
    if (user) {
      setShowWelcomeToast(true)
    }
  }

  // Redirect to dashboard if already logged in
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
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
        <Shadow />
        <Vision />
        <Stats />
        <Problems />
        <Pipeline />
        <Gates />
        <SecurityVerification />
        <Counterfactual />
        <FailureModes />
        <Replay />
        <FinalCTA />
      </main>

      <Footer />

      <AnimatePresence>
        {isSignUpOpen && <AuthPage onBack={handleAuthClose} />}
      </AnimatePresence>

      <Toast
        show={showWelcomeToast}
        message={`Welcome${user ? `, ${user.name.split(' ')[0]}` : ''}!`}
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
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Product Application Routes */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/experiment" element={<Experiment />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/decisions/:id" element={<DecisionDetail />} />
            <Route path="/counterfactual" element={<CounterfactualPage />} />
            <Route path="/replay" element={<IndiaReplay />} />
            <Route path="/risk" element={<BehavioralRisk />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/shadow" element={<ShadowLab />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/system" element={<SystemPage />} />
          </Route>

          {/* Redirect unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
