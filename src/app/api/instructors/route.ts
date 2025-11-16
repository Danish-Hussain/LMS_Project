import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, createUser, hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      orderBy: { createdAt: 'desc' }
    }) as any

    return NextResponse.json(instructors)
  } catch (e) {
    console.error('GET /api/instructors error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await request.json()
    const { name, email, password, roles } = body || {}
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    // roles can be array like ['BLOGS','COURSES'] or object with booleans
    let canCreateBlogs = false
    let canCreateCourses = false
    if (Array.isArray(roles)) {
      canCreateBlogs = roles.includes('BLOGS')
      canCreateCourses = roles.includes('COURSES')
    } else if (roles && typeof roles === 'object') {
      canCreateBlogs = !!roles.blogs
      canCreateCourses = !!roles.courses
    }

    const createdUser = await createUser(email, password, name, 'INSTRUCTOR')
    await prisma.user.update({
      where: { id: createdUser.id },
      data: { canCreateBlogs, canCreateCourses } as any,
    })

    return NextResponse.json({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      canCreateBlogs,
      canCreateCourses
    })
  } catch (e: any) {
    console.error('POST /api/instructors error:', e)
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
