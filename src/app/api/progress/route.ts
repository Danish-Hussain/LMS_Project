import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
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

  const { sessionId, watchedTime, completed } = await request.json()

    if (!sessionId || watchedTime === undefined) {
      return NextResponse.json(
        { error: 'Session ID and watched time are required' },
        { status: 400 }
      )
    }

    // Upsert progress record
    // Use findFirst + update/create to match schema where unique composite name isn't present
    const existing = await prisma.progress.findFirst({
      where: { userId: user.id, sessionId }
    })

    let progress
    if (existing) {
      progress = await prisma.progress.update({
        where: { id: existing.id },
        data: {
          watchedTime: Math.floor(watchedTime),
          completed: completed || false,
          updatedAt: new Date()
        }
      })
    } else {
      progress = await prisma.progress.create({
        data: {
          userId: user.id,
          sessionId,
          watchedTime: Math.floor(watchedTime),
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
