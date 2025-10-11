import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: any }) {
  try {
    const { id } = await context.params
    const section = await prisma.courseSection.findUnique({
      where: { id },
      include: { sessions: { orderBy: { order: 'asc' } } }
    })
    if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(section)
  } catch (error) {
    console.error('Fetch section error:', error)
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: any }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    if (!['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { title, description, order } = body

    const updated = await prisma.courseSection.update({
      where: { id },
      data: { title, description, order }
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update section error:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    if (!['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await context.params
    await prisma.courseSection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete section error:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
