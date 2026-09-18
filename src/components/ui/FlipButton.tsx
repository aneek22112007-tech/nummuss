import type { ReactNode } from 'react'
import { scrollToId } from '../../lib/useSmoothScroll'

type Variant = 'ghost' | 'solid' | 'mint'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  size?: 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
}

const variants: Record<Variant, string> = {
  ghost: '',
  solid: 'btn-flip--solid',
  mint: 'btn-flip--mint',
}

/**
 * The reference site swaps the label vertically on hover (two stacked spans).
 * Same effect here, driven purely by CSS transitions on the `.btn-flip` class.
 */
export function FlipButton({
  children,
  href,
  onClick,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
}: Props) {
  const classes = ['btn-flip', variants[variant], size === 'lg' ? 'btn-flip--lg' : '', className]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (href?.startsWith('#')) scrollToId(href)
    onClick?.()
  }

  const inner = (
    <span className="btn-flip__face">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        onClick={(event) => {
          event.preventDefault()
          handleClick()
        }}
      >
        {inner}
      </a>
    )
  }

  return (
    <button type={type} className={classes} onClick={handleClick}>
      {inner}
    </button>
  )
}
