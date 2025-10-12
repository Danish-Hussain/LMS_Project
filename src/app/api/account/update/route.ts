import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email } = body
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

  const token = (req as any).cookies?.get?.('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authUser = await verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updated = await prisma.user.update({ where: { id: authUser.id }, data: { name, email } })

    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
