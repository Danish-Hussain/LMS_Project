export default function Head() {
  return (
    <>
      {/* Explicit favicon links to ensure immediate updates across browsers */}
      <link rel="icon" href="/icon.png?v=4" sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png?v=4" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png?v=4" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=4" />
      <link rel="manifest" href="/site.webmanifest?v=4" />
    </>
  )
}
