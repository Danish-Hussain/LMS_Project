import React from 'react'

type Props = {
  className?: string
  style?: React.CSSProperties
  /** Desired logo height in px (defaults to 36) */
  size?: number
  /** Variant to render: 'dark', 'light', or 'auto' (auto uses prefers-color-scheme) */
  variant?: 'dark' | 'light' | 'auto'
}

export default function Wordmark({ className = '', style = {}, size = 44, variant = 'auto' }: Props) {
  // Use packaged SVGs under /public/branding. We wrap the <img> so the
  // logo always respects a sane max height (prevents huge overflow) and can
  // be sized via the `size` prop.
  const height = typeof size === 'number' ? size : 36

  // If a specific variant is requested, render that directly.
  if (variant === 'dark') {
    return (
      <div className={className} style={{ display: 'inline-block', height, lineHeight: 1, ...style }} role="img" aria-label="SAP Integration Expert">
        <img src="/branding/wordmark-dark.svg" alt="SAP Integration Expert" style={{ display: 'block', height: '100%', width: 'auto', maxWidth: '100%' }} draggable={false} />
      </div>
    )
  }

  if (variant === 'light') {
    return (
      <div className={className} style={{ display: 'inline-block', height, lineHeight: 1, ...style }} role="img" aria-label="SAP Integration Expert">
        <img src="/branding/wordmark-light.svg" alt="SAP Integration Expert" style={{ display: 'block', height: '100%', width: 'auto', maxWidth: '100%' }} draggable={false} />
      </div>
    )
  }

  // auto variant: Render a stable <picture> element on the server so the
  // HTML structure is identical during hydration. The <source> handles the
  // system `prefers-color-scheme` case automatically; for site-level toggles
  // that add/remove a `.dark` class on <html>, update the inner <img>'s
  // src client-side via a ref. We also watch for class changes so toggles
  // update the image without a full reload.
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  React.useEffect(() => {
    const doc = document.documentElement

    function apply() {
      try {
        const hasSiteDark = doc.classList && doc.classList.contains('dark')
        if (imgRef.current) {
          imgRef.current.src = hasSiteDark ? '/branding/wordmark-dark.svg' : '/branding/wordmark-light.svg'
        }
      } catch (e) {
        // ignore
      }
    }

    // Apply once on mount (covers the case where a `.dark` class is already present)
    apply()

    // Observe mutations to the <html> class attribute so theme toggles swap the image.
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m as MutationRecord).attributeName === 'class') {
          apply()
          break
        }
      }
    })

    obs.observe(doc, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className={className} style={{ display: 'inline-block', height, lineHeight: 1, ...style }} role="img" aria-label="SAP Integration Expert">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet="/branding/wordmark-dark.svg" />
        <img ref={imgRef} src="/branding/wordmark-light.svg" alt="SAP Integration Expert" style={{ display: 'block', height: '100%', width: 'auto', maxWidth: '100%' }} draggable={false} />
      </picture>
    </div>
  )
}
