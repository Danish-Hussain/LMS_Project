import React from 'react'

export default function Wordmark({ className = 'h-9', style = {} }: { className?: string; style?: React.CSSProperties }) {
  // Keep the SVG viewBox and remove hardcoded width/height so CSS can control sizing.
  return (
    <svg
      // widen the viewBox horizontally so long text isn't clipped and allow overflow
      viewBox="0 50 1400 160"
      preserveAspectRatio="xMinYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="site-logo-title site-logo-desc"
      className={className}
      style={{ display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))', overflow: 'visible', width: 'auto', ...style }}
      overflow="visible"
    >
      <title id="site-logo-title">SAP Integration Expert — Wordmark</title>
      <desc id="site-logo-desc">SAP in brand blue; Integration Expert in black (light) or light (dark).</desc>
      <defs></defs>
      <text x={0} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} style={{ fill: 'var(--brand-primary)' }}>
        SAP
      </text>
      <text x={250} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} style={{ fill: 'var(--brand-integration)', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.03))' }}>
        Integration Expert
      </text>
    </svg>
  )
}
