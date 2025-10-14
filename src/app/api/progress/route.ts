import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Accept auth either from a cookie (auth-token) or an Authorization header
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined
    const token = cookieToken ?? bearer

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

  const body = await request.json()
    const { sessionId, completed } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Upsert progress record (only completed flag is stored now)
    // Use findFirst + update/create to match schema where unique composite name isn't present
    const existing = await prisma.progress.findFirst({
      where: { userId: user.id, sessionId }
    })

    let progress
    if (existing) {
      progress = await prisma.progress.update({
        where: { id: existing.id },
        data: {
          completed: completed || false,
          updatedAt: new Date()
        }
      })
    } else {
      progress = await prisma.progress.create({
        data: {
          userId: user.id,
          sessionId,
          completed: completed || false
        }
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get progress for specific session
      const progress = await prisma.progress.findFirst({
        where: { userId: user.id, sessionId }
      })

      return NextResponse.json(progress)
    } else {
      // Get all progress for user
      const progress = await prisma.progress.findMany({
        where: {
          userId: user.id
        },
        include: {
          session: {
            select: {
              title: true,
              course: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json(progress)
    }
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
