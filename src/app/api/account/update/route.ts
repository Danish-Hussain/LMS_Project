import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string }
    const { name } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authUser = await verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updated = await prisma.user.update({ where: { id: authUser.id }, data: { name } })

    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
