import { NextResponse } from 'next/server'

// Lightweight health endpoint that does not touch the database. Use this to
// verify the Next server is up in production (Netlify) without depending on
// external services.
export async function GET() {
  try {
    return NextResponse.json({ ok: true, timestamp: Date.now() })
  } catch (err) {
    // Defensive: should never happen, but surface the error for logs
    console.error('health GET error', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
