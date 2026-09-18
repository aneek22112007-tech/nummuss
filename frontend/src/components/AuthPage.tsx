import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { HeroCanvas } from './HeroCanvas'
import { useAuth } from '../lib/auth'

type AuthMode = 'login' | 'signup'
type Status = 'idle' | 'loading' | 'success' | 'error'

interface AuthPageProps {
  onBack: () => void
}

interface GoogleJwtPayload {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AuthPageContent({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { login } = useAuth()

  const toggleMode = () => {
    setMode(prev => (prev === 'signup' ? 'login' : 'signup'))
    setStatus('idle')
    setErrorMessage('')
  }

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received')
      }

      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential)
      
      login({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        provider: 'google',
      })

      setStatus('success')
      
      // Show success message briefly then redirect
      setTimeout(() => {
        onBack()
        // Scroll to top of page after redirect
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 1800)
    } catch (error) {
      console.error('Google login error:', error)
      setStatus('error')
      setErrorMessage('Failed to process Google authentication')
    }
  }

  const handleGoogleError = () => {
    setStatus('error')
    setErrorMessage('Google authentication failed. Please try again.')
  }

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const name = formData.get('name') as string || email.split('@')[0]

    // Simulate email auth (in production, this would call your backend)
    setTimeout(() => {
      login({
        id: `email-${Date.now()}`,
        email,
        name,
        provider: 'email',
      })
      setStatus('success')
      
      // Show success message briefly then redirect
      setTimeout(() => {
        onBack()
        // Scroll to top of page after redirect
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 1800)
    }, 1500)
  }

  // Define stagger animation variants for form elements
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-x-hidden bg-charcoal"
    >
      
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-charcoal">
        <HeroCanvas />
        {/* Subtle dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-charcoal/40" />
      </div>

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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] border border-snow/10 bg-charcoal/80 p-8 shadow-2xl backdrop-blur-xl md:p-10"
          >
            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-mint/10 text-mint">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-snow">
                  {mode === 'signup' ? 'Welcome to Nummuss' : 'Welcome back'}
                </h2>
                <p className="mt-3 text-snow/60">
                  {mode === 'signup' 
                    ? "You're signed up! Redirecting to your dashboard..."
                    : "Successfully signed in. Redirecting..."}
                </p>
                <button
                  onClick={onBack}
                  className="mt-8 w-full rounded-2xl bg-snow/10 px-4 py-3.5 font-semibold text-snow transition-colors hover:bg-snow/20"
                >
                  Return to Nummuss
                </button>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-mint text-xl font-bold text-charcoal">
                    N
                  </div>
                  <h1 className="font-display text-4xl font-semibold tracking-tight text-snow">
                    {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                  </h1>
                  <p className="mt-2 text-snow/60">
                    {mode === 'signup' 
                      ? 'Start using the behavioral safety layer for AI trading agents.'
                      : 'Sign in to access your Nummuss dashboard.'}
                  </p>
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
                  >
                    {errorMessage}
                  </motion.div>
                )}

                <motion.form 
                  variants={containerVars}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5" 
                  onSubmit={handleEmailSubmit}
                >
                  
                  <motion.div
                    variants={itemVars}
                    className="flex w-full items-center justify-center"
                  >
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      shape="pill"
                      size="large"
                      text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                      width="384"
                      logo_alignment="left"
                    />
                  </motion.div>

                  <motion.div variants={itemVars} className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-snow/10"></div>
                    <span className="mx-4 shrink-0 text-xs text-snow/40">OR</span>
                    <div className="flex-grow border-t border-snow/10"></div>
                  </motion.div>

                  {mode === 'signup' && (
                    <motion.div variants={itemVars} className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-snow/80">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                      />
                    </motion.div>
                  )}
                  
                  <motion.div variants={itemVars} className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-snow/80">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                    />
                  </motion.div>

                  <motion.div variants={itemVars} className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-snow/80">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full rounded-2xl border border-snow/10 bg-charcoal/40 px-4 py-3.5 text-snow outline-none transition-colors placeholder:text-snow/30 focus:border-mint focus:bg-charcoal/60 focus:ring-1 focus:ring-mint"
                    />
                  </motion.div>

                  <motion.button 
                    variants={itemVars}
                    disabled={status === 'loading'}
                    className="relative mt-4 flex w-full items-center justify-center rounded-2xl bg-mint px-4 py-4 font-semibold text-charcoal transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-80"
                  >
                    {status === 'loading' ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-charcoal/30 border-t-charcoal"></div>
                    ) : (
                      mode === 'signup' ? 'Create Account' : 'Sign In'
                    )}
                  </motion.button>
                </motion.form>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center text-sm text-snow/60"
                >
                  {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                  <button onClick={toggleMode} className="font-semibold text-mint hover:underline">
                    {mode === 'signup' ? 'Log in' : 'Sign up'}
                  </button>
                </motion.p>
              </>
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <span className="inline-block rounded-full border border-snow/10 bg-charcoal/50 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-snow/40 backdrop-blur-md">
              Simulation only · No real capital
            </span>
          </motion.div>

        </div>
      </div>
    </motion.div>
  )
}

export function AuthPage({ onBack }: AuthPageProps) {
  // If no Google Client ID is configured, show a setup message
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here.apps.googleusercontent.com') {
    return (
      <GoogleOAuthProvider clientId="demo-client-id">
        <AuthPageContent onBack={onBack} />
      </GoogleOAuthProvider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthPageContent onBack={onBack} />
    </GoogleOAuthProvider>
  )
}
