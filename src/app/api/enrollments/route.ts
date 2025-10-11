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

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Ensure the token corresponds to an existing user record
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { courseId, batchId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: 'Course is not published' },
        { status: 403 }
      )
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
        batchId: batchId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 409 }
      )
    }

    // If enrolling into a batch, ensure no time conflicts with user's existing enrolled batches
    if (batchId) {
      // Ensure the batch exists and belongs to the same course
      const batch = await prisma.batch.findUnique({ where: { id: batchId } })
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 400 })
      }

      if (batch.courseId !== courseId) {
        return NextResponse.json({ error: 'Batch does not belong to the specified course' }, { status: 400 })
      }
      // Fetch sessions for the target batch
      const targetSessions = await prisma.session.findMany({
        where: { batchId },
        select: { startTime: true, endTime: true }
      }) as { startTime?: string | null; endTime?: string | null }[]

      if (targetSessions.length > 0) {
        // Fetch user's existing enrollments with their batches' sessions
        const userEnrollments = await prisma.enrollment.findMany({
          where: { userId: user.id },
          include: {
            batch: {
              include: {
                sessions: {
                  select: { startTime: true, endTime: true }
                }
              }
            }
          }
        })

        const hasConflict = userEnrollments.some((en: any) => {
          const otherSessions = (en.batch?.sessions || []) as { startTime?: string | null; endTime?: string | null }[]
          return otherSessions.some((os) => {
            if (!os.startTime || !os.endTime) return false
            return targetSessions.some((ts) => {
              if (!ts.startTime || !ts.endTime) return false
              // Overlap if ts.start < os.end && os.start < ts.end
              const tsStart = new Date(ts.startTime as string)
              const tsEnd = new Date(ts.endTime as string)
              const osStart = new Date(os.startTime as string)
              const osEnd = new Date(os.endTime as string)
              return tsStart < osEnd && osStart < tsEnd
            })
          })
        })

        if (hasConflict) {
          return NextResponse.json(
            { error: 'Schedule conflict with another enrolled batch' },
            { status: 409 }
          )
        }
      }
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        batchId: batchId || null
      },
      include: {
        course: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Enrollment error:', error)
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

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            isPublished: true,
            creator: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                sessions: true
              }
            }
          }
        },
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Enrollments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
