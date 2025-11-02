import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Canonical host redirect: send www.* to apex, and enforce a single host to
// avoid host-only cookie mismatches during payment verification.
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const host = req.headers.get('host') || ''

  // Allow localhost and Netlify deploy previews to bypass canonical redirect
  const bypass = host.includes('localhost') || host.includes('--') || host.endsWith('.netlify.app')
  if (bypass) return NextResponse.next()

  // If host starts with www., redirect to apex
  if (host.startsWith('www.')) {
    const apex = host.replace(/^www\./, '')
    url.host = apex
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|site.webmanifest|sw.js|offline.html).*)'
  ]
}
