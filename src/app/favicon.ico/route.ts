import type { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export function GET(request: NextRequest) {
  // Prefer serving a real /public/favicon.ico binary if present (best cross-browser).
  try {
    const icoPath = join(process.cwd(), 'public', 'favicon.ico')
    const ico = readFileSync(icoPath)
    return new Response(ico, {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (e) {
    // If no ICO exists, fall back to serving the SVG favicon directly if available
    try {
      const svgPath = join(process.cwd(), 'public', 'branding', 'favicon.svg')
      const svg = readFileSync(svgPath)
      return new Response(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    } catch (err) {
      // Final fallback: redirect to a PNG
      const target = new URL('/icons/icon-192x192.png', request.url)
      return Response.redirect(target, 308)
    }
  }
}
