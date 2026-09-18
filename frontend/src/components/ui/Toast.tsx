import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ToastProps {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ show, message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const colors = {
    success: 'border-mint/40 bg-mint/10 text-mint',
    error: 'border-danger/40 bg-danger/10 text-danger',
    info: 'border-snow/40 bg-snow/10 text-snow',
  }

  const icons = {
    success: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-[100] max-w-md"
        >
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${colors[type]}`}>
            <div className="shrink-0">
              {icons[type]}
            </div>
            <p className="text-sm font-medium">{message}</p>
            <button
              onClick={onClose}
              className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
