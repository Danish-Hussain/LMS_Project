import React from 'react'

type Props = {
  className?: string
  style?: React.CSSProperties
  /** Desired logo height in px (defaults to 36) */
  size?: number
  /** Variant to render: 'dark' or 'light' (falls back to dark) */
  variant?: 'dark' | 'light'
}

export default function Wordmark({ className = '', style = {}, size = 44, variant = 'dark' }: Props) {
  // Use the packaged SVGs under /public/branding. We wrap the <img> so the
  // logo always respects a sane max height (prevents huge overflow) and can
  // be sized via the `size` prop.
  const src = variant === 'light' ? '/branding/wordmark.svg' : '/branding/wordmark-dark.svg'

  return (
    <div
      className={className}
      style={{ display: 'inline-block', height: typeof size === 'number' ? size : 36, lineHeight: 1, ...style }}
      role="img"
      aria-label="SAP Integration Expert"
    >
      <img
        src={src}
        alt="SAP Integration Expert"
        style={{ display: 'block', height: '100%', width: 'auto', maxWidth: '100%' }}
        draggable={false}
      />
    </div>
  )
}
