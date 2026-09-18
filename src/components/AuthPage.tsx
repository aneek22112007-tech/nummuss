import { useState } from 'react'
import { motion } from 'motion/react'

type AuthMode = 'login' | 'signup'

interface AuthPageProps {
  onBack: () => void
}

export function AuthPage({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('signup')

  const toggleMode = () => setMode(prev => (prev === 'signup' ? 'login' : 'signup'))

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-charcoal">
      
      {/* Background Video */}
      <div className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-charcoal">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none h-full w-full object-cover opacity-80"
        >
          <source src="https://www.image2url.com/r2/default/videos/1789704964087-164abff6-ef40-420e-95cf-46b97b167d97.mp4" type="video/mp4" />
        </video>
        {/* Subtle dark overlay to ensure text readability without dimming too much */}
        <div className="absolute inset-0 bg-charcoal/40" />
      </div>

      {/* Background Orbs to enhance the gradient */}
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-snow/5 blur-[100px]" />

      {/* Header for Back Button */}
      <div className="relative z-20 w-full p-6 lg:p-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-snow/10 bg-snow/5 px-4 py-2 text-sm font-medium text-snow/80 backdrop-blur-md transition-colors hover:bg-snow/10 hover:text-snow"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Nummuss
        </button>
      </div>

      <div className="container relative mx-auto flex flex-1 w-full max-w-7xl flex-col px-4 pb-12 lg:px-8">
        
        {/* Form Area */}
        <div className="relative z-10 w-full max-w-md my-auto mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="overflow-hidden rounded-[2.5rem] border border-snow/10 bg-charcoal/60 p-8 shadow-2xl backdrop-blur-xl md:p-10"
          >
            <div className="mb-8">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-snow">
                {mode === 'signup' ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-snow/60">
                {mode === 'signup' 
                  ? 'Join the experiment and start trading with behavioral guardrails.'
                  : 'Enter your details to access your dashboard.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-snow/10 bg-snow/5 px-4 py-3.5 text-sm font-medium text-snow transition-colors hover:bg-snow/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-snow/10"></div>
                <span className="mx-4 shrink-0 text-xs text-snow/40">OR</span>
                <div className="flex-grow border-t border-snow/10"></div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-snow/80">Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-snow/80">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-snow/80">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                />
              </div>

              <button className="mt-4 w-full rounded-2xl bg-mint px-4 py-4 font-semibold text-charcoal transition-transform hover:scale-[1.02] active:scale-[0.98]">
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-snow/60">
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={toggleMode} className="font-semibold text-mint hover:underline">
                {mode === 'signup' ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
