import { NextResponse } from 'next/server'
import { checkDb } from '@/lib/db'

export async function GET() {
  try {
    const res = await checkDb()
    if (res.ok) return NextResponse.json({ ok: true, db: true, timestamp: Date.now() })

    // Return a short, sanitized message for logs and HTTP viewers.
    return NextResponse.json({ ok: false, db: false, error: res.error }, { status: 503 })
  } catch (err) {
    console.error('health/db route error', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
