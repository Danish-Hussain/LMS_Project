import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Course, Progress, Session, User } from '@prisma/client'

type AuthUser = {
  id: string
  role: string
}

type SessionWithProgress = Session & {
  progress: Progress | null
}

type CourseWithRelations = Course & {
  creator: {
    id: string
    name: string
  }
  sessions: SessionWithProgress[]
  batches: {
    id: string
    _count: {
      students: number
    }
  }[]
  _count: {
    enrollments: number
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('auth-token')?.value
    
    // Check authentication
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token) as AuthUser

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Fetch course with all related data
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
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
            _count: {
              select: {
                students: true
              }
            }
          },
          where: {
            OR: [
              { isActive: true },
              { courseId: params.id },
              user.role === 'ADMIN' ? {} : undefined
            ].filter(Boolean) as any[]
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    }) as CourseWithRelations | null

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check access rights
    const isAdmin = user.role === 'ADMIN'
    const isCreator = course.creatorId === user.id

    if (!isAdmin && !isCreator && !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not published' },
        { status: 403 }
      )
    }

    // Get enrollment status
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: course.id,
        userId: user.id
      },
      select: {
        batchId: true
      }
    })

    const isEnrolled = enrollments.length > 0
    const enrolledBatchIds = enrollments.map(e => e.batchId)

    // Get progress for each session if user is enrolled
    const finalSessions = isEnrolled 
      ? await Promise.all(
          course.sessions.map(async (session) => {
            const progress = await prisma.progress.findFirst({
              where: {
                userId: user.id,
                sessionId: session.id
              }
            })
            
            return {
              ...session,
              progress
            }
          })
        )
      : course.sessions

    const courseWithProgress = {
      ...course,
      sessions: finalSessions
    }

    return NextResponse.json({
      course: courseWithProgress,
      isEnrolled,
      enrolledBatchIds
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const user = await verifyToken(token) as AuthUser

    if (!user || !['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const courseId = params.id
    const { title, description, thumbnail, isPublished } = await request.json()

    // Validate thumbnail URL if provided
    if (thumbnail !== undefined && thumbnail !== null) {
      if (typeof thumbnail !== 'string') {
        return NextResponse.json(
          { error: 'Thumbnail must be a URL string' },
          { status: 400 }
        )
      }
      try {
        new URL(thumbnail)
      } catch (e) {
        return NextResponse.json(
          { error: 'Thumbnail must be a valid URL starting with http:// or https://' },
          { status: 400 }
        )
      }
    }

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

    const user = await verifyToken(token) as AuthUser

    if (!user || !['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
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

    // Delete the course and all related data
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Course deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
