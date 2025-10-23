import type { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  // Permanent redirect to the current PNG favicon with cache-busting
  const target = new URL('/icon.png?v=4', request.url)
  return Response.redirect(target, 308)
}
