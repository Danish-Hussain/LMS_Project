import { NextResponse } from 'next/server'

// Yearly access feature has been removed. Keep a minimal route to avoid
// runtime/compile errors if any remaining code references this endpoint.
export async function GET() {
  return NextResponse.json({ error: 'Yearly access feature removed' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Yearly access feature removed' }, { status: 410 })
}