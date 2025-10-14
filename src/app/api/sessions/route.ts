import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

  const body = (await request.json()) as { title?: string; videoUrl?: string; order?: string | number | null; batchId?: string; startTime?: string | null; endTime?: string | null }
  const { title, videoUrl, order, batchId, startTime, endTime } = body

    if (!title || !videoUrl || !batchId) {
      return NextResponse.json(
        { error: 'Title, video URL, and batch ID are required' },
        { status: 400 }
      )
    }

    // Get the batch to find the course ID
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    const parsedOrder = typeof order === 'number' ? order : order ? parseInt(String(order)) : 1

    const session = await prisma.session.create({
      data: {
        title,
        videoUrl,
        order: Number.isNaN(parsedOrder) ? 1 : parsedOrder,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        courseId: batch.courseId,
        batchId
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

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
    const batchId = searchParams.get('batchId')

    if (batchId) {
      // Get sessions for a specific batch
      const sessions = await prisma.session.findMany({
        where: { batchId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          videoUrl: true,
          order: true,
          startTime: true,
          endTime: true,
          courseId: true,
          batchId: true,
          sectionId: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return NextResponse.json(sessions)
    }

    // Get all sessions for the user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        batch: {
          include: {
            sessions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                order: true,
                startTime: true,
                endTime: true,
                courseId: true,
                batchId: true,
                sectionId: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      }
    })

    const sessions = enrollments.flatMap((enrollment) => {
      const batchSessions = (enrollment.batch?.sessions ?? []) as unknown as Array<Record<string, unknown>>
      return batchSessions.map((s) => ({
        ...(s as Record<string, unknown>),
        batchName: enrollment.batch?.name ?? null,
        courseId: enrollment.courseId,
      }))
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
