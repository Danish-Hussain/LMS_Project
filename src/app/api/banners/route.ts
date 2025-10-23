import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

const dataPath = path.join(process.cwd(), 'data', 'banners.json')

export async function GET() {
  try {
    const json = await fs.readFile(dataPath, 'utf-8')
    return new NextResponse(json, { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load banners' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    // Expect an array of banner items
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    await fs.mkdir(path.dirname(dataPath), { recursive: true })
    await fs.writeFile(dataPath, JSON.stringify(body, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Save banners error', e)
    return NextResponse.json({ error: 'Failed to save banners' }, { status: 500 })
  }
}
