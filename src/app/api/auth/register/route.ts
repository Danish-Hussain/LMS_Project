import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
// import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
    const userRole = role && validRoles.includes(role) ? role : 'STUDENT'

    const user = await createUser(email, password, name, userRole)
  // Newly created user should have tokenVersion on DB (default 0). Fetch to be explicit.
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  const token = generateToken(user, dbUser?.tokenVersion)
    
    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
