import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            name: true
          }
        },
        sessions: {
          orderBy: {
            order: 'asc'
          }
        },
        batches: {
          include: {
            _count: { select: { students: true } }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'
    const isCreator = course.creatorId === user.id

    // Check if user is enrolled in this course and which batches
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        courseId: courseId
      },
      select: { batchId: true }
    })
    const isEnrolled = enrollments.length > 0
    const enrolledBatchIds = enrollments.map(e => e.batchId)

    // If not admin, creator, or enrolled, and course is not published, deny access
    if (!isAdmin && !isCreator && !isEnrolled && !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not published' },
        { status: 403 }
      )
    }

    // Get progress for each session
    const sessionsWithProgress = await Promise.all(
      course.sessions.map(async (session: any) => {
        const progress = await prisma.progress.findUnique({
          where: {
            userId_sessionId: {
              userId: user.id,
              sessionId: session.id
            }
          }
        })

        return {
          ...session,
          progress: progress ? {
            watchedTime: progress.watchedTime,
            completed: progress.completed
          } : null
        }
      })
    )

    return NextResponse.json({
      course: {
        ...course,
        sessions: sessionsWithProgress
      },
      isEnrolled,
      enrolledBatchIds
    })
  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id: courseId } = await params
    const { title, description, thumbnail, isPublished } = await request.json()

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator or admin
    if (user.role !== 'ADMIN' && course.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        thumbnail,
        isPublished
      },
      include: {
        creator: {
          select: {
            name: true
          }
        },
        sessions: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Course update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const courseId = params.id

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator or admin
    if (user.role !== 'ADMIN' && course.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Course deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
