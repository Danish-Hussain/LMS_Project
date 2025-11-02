import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

  // Fetch tokenVersion from DB and include it in token payload
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  const token = generateToken(user, dbUser?.tokenVersion)
    
    // Set HTTP-only cookie
    const cookieStore = await cookies()
    // Derive cookie domain for production so apex and subdomain share auth if redirected
    const reqHost = request.headers.get('host') || ''
    const envDomain = process.env.COOKIE_DOMAIN || process.env.NEXT_PUBLIC_COOKIE_DOMAIN
    const deriveDomain = () => {
      if (envDomain) return envDomain
      if (!reqHost || reqHost.includes('localhost')) return undefined
      const host = reqHost.split(':')[0]
      const parts = host.split('.')
      if (parts.length >= 2) {
        const base = parts.slice(-2).join('.')
        return `.${base}`
      }
      return undefined
    }
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      ...(process.env.NODE_ENV === 'production' && deriveDomain() ? { domain: deriveDomain() } : {})
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
