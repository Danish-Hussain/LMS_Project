export default function NotFound() {
  return (
    <div style={{ padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--session-subtext)' }}>
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <a href="/" style={{ color: '#3b82f6', display: 'inline-block', marginTop: 16 }}>Go back home</a>
    </div>
  )
}
