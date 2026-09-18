import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from './components/Header'
import { NavOverlay } from './components/NavOverlay'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { Vision } from './components/Vision'
import { Stats } from './components/Stats'
import { Problems } from './components/Problems'
import { Pipeline } from './components/Pipeline'
import { Gates } from './components/Gates'
import { Counterfactual } from './components/Counterfactual'
import { FailureModes } from './components/FailureModes'
import { Replay } from './components/Replay'
import { Shadow } from './components/Shadow'
import { Footer } from './components/Footer'
import { AuthPage } from './components/AuthPage'
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
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSignUpOpen, setSignUpOpen] = useState(false)

  // Lenis inertia scrolling, synced to the GSAP ScrollTrigger ticker
  useSmoothScroll()

  return (
    <div className="relative overflow-x-clip">
      <Header onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <NavOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main>
        <Hero onTryClick={() => setSignUpOpen(true)} />
        <Marquee />
        <Vision />
        <Stats />
        <Problems />
        <Pipeline />
        <Gates />
        <Counterfactual />
        <FailureModes />
        <Replay />
        <Shadow />
      </main>

      <Footer />

      <AnimatePresence>
        {isSignUpOpen && <AuthPage onBack={() => setSignUpOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
