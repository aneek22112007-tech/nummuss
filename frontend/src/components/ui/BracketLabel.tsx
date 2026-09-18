import { motion } from 'motion/react'

type Props = {
  children: string
  className?: string
  /** animate each letter in when scrolled into view */
  animate?: boolean
}

/**
 * The site's section eyebrows are wrapped in literal brackets and reveal
 * letter by letter. Same treatment: `[ Vision ]`.
 */
export function BracketLabel({ children, className = '', animate = true }: Props) {
  const letters = Array.from(children)

  return (
    <span
      className={`inline-block font-body text-[13px] font-medium uppercase tracking-[0.14em] text-snow/60 ${className}`}
    >
      <span aria-hidden="true">[&nbsp;</span>
      {animate ? (
        <motion.span
          className="inline-block"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          transition={{ staggerChildren: 0.022 }}
        >
          {letters.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: '0.5em' },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {letter === ' ' ? '\u00a0' : letter}
            </motion.span>
          ))}
        </motion.span>
      ) : (
        <span>{children}</span>
      )}
      <span aria-hidden="true">&nbsp;]</span>
    </span>
  )
}
