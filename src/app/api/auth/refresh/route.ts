import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('refresh-token')?.value
    if (!token) return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 })

    const user = await verifyRefreshToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, dbUser.tokenVersion)

    const isProd = process.env.NODE_ENV === 'production'
    cookieStore.set('auth-token', accessToken, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 15 * 60 })
    cookieStore.set('refresh-token', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Refresh token error (app route):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
