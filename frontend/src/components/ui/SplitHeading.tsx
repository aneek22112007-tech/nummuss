import type { ReactNode } from 'react'
import { motion } from 'motion/react'

type Props = {
  lines: (ReactNode)[]
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3'
}

/**
 * Masked line-by-line reveal — each line sits in an overflow-hidden row and
 * slides up from below, staggered. This is the site's signature headline move.
 *
 * IMPORTANT: `whileInView` is attached to the *wrapper* row, not the sliding
 * child. The child starts 110% down inside an `overflow-hidden` parent, so the
 * browser clips it out of its intersection rect entirely — observing the child
 * would deadlock and the heading would never animate into view.
 */
export function SplitHeading({ lines, className = '', delay = 0, as = 'h2' }: Props) {
  const Tag = as

  return (
    <Tag className={`font-display uppercase leading-[0.92] ${className}`}>
      {lines.map((line, index) => (
        <motion.span
          key={index}
          className="block overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
        >
          <motion.span
            className="block"
            variants={{ hidden: { y: '110%' }, visible: { y: '0%' } }}
            transition={{
              duration: 1.05,
              delay: delay + index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  )
}
