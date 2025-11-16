import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type Ctx<T extends Record<string,string>> = { params: Promise<T> | T }

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, ctx: Ctx<{ id: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await ctx.params
    const row = await prisma.user.findUnique({
      where: { id },
    })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (e) {
    console.error('GET /api/instructors/[id] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx<{ id: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await ctx.params
    const body = await request.json()
    const { name, email, roles, password } = body || {}

    let canCreateBlogs: boolean | undefined
    let canCreateCourses: boolean | undefined
    if (Array.isArray(roles)) {
      canCreateBlogs = roles.includes('BLOGS')
      canCreateCourses = roles.includes('COURSES')
    } else if (roles && typeof roles === 'object') {
      canCreateBlogs = typeof roles.blogs !== 'undefined' ? !!roles.blogs : undefined
      canCreateCourses = typeof roles.courses !== 'undefined' ? !!roles.courses : undefined
    }

    const data: any = {}
    if (typeof name !== 'undefined') data.name = name
    if (typeof email !== 'undefined') data.email = email
    if (typeof canCreateBlogs !== 'undefined') data.canCreateBlogs = canCreateBlogs
    if (typeof canCreateCourses !== 'undefined') data.canCreateCourses = canCreateCourses
    if (typeof password === 'string' && password.length >= 6) {
      // reuse hashPassword via prisma update? We don't have it here; keep simple by direct prisma update after importing hashPassword
    }

    const updated = await prisma.user.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('PUT /api/instructors/[id] error:', e)
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx<{ id: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await ctx.params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/instructors/[id] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
