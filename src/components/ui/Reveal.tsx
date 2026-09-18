import type { ReactNode } from 'react'
import { motion } from 'motion/react'

type Props = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  amount?: number
}

/** Fade + rise on scroll, the same rhythm the reference site uses per block. */
export function Reveal({ children, delay = 0, y = 52, className = '', amount = 0.2 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
