import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
    cookieStore.delete('refresh-token')

    // Try to invalidate refresh tokens server-side by bumping tokenVersion
    try {
      const refresh = cookieStore.get('refresh-token')?.value
      const access = cookieStore.get('auth-token')?.value
      const token = refresh || access
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        if (decoded?.userId) {
          await prisma.user.update({ where: { id: decoded.userId }, data: { tokenVersion: { increment: 1 } } })
        }
      }
    } catch (e) {
      // noop
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
