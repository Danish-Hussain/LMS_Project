import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Prisma, PrismaClient } from '@prisma/client'

type AuthUser = {
  id: string
  role: string
}

// Use flexible types for DB shapes to avoid tight coupling to generated Prisma types
type CourseDB = {
  id: string
  creatorId?: string
  title: string
  description?: string | null
  thumbnail?: string | null
  price?: number | null
  isPublished: boolean
  sessions?: Array<{
    id: string
    title: string
    videoUrl: string
    order: number
    isPublished: boolean
    courseId: string
    batchId: string
  }>
  batches?: Array<{
    id: string
    name: string
    isActive: boolean
    sections?: Array<{
      id: string
      title: string
      sessions: Array<{
        id: string
        title: string
        videoUrl: string
        order: number
        isPublished: boolean
      }>
    }>
    _count?: { students: number }
  }>
  creator?: { id?: string; name?: string }
  _count?: { enrollments: number }
}

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

export async function GET(req: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const token = req.cookies.get('auth-token')?.value
    const params = (await context.params) as { id: string }
    const courseId = params.id
    
    if (!courseId) {
      console.error('Course ID missing in request');
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    if (!token) {
      console.error('No auth token in request');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token) as AuthUser

    if (!user) {
      console.error('Invalid token verification');
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    console.log('Auth successful for user:', { userId: user.id, role: user.role, courseId });

    // courseId already set above
    // Build typed OR clause for batches depending on user role
    const batchOr: Prisma.BatchWhereInput[] = [
      { isActive: true },
      { courseId: courseId },
      ...(user.role === 'ADMIN' ? ([{}] as Prisma.BatchWhereInput[]) : [])
    ]

    let course: CourseDB | null;

    try {
      // Log the query attempt
      console.log('Attempting to fetch course:', { courseId });

      // Verify course exists first with a simple query
      const courseExists = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true }
      });

      if (!courseExists) {
        console.error('Course not found:', { courseId });
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Fetch course with all related data
      course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          sessions: {
            where: {
              courseId: courseId
            },
            orderBy: {
              order: 'asc'
            }
          },
          batches: {
            where: {
              OR: batchOr
            },
            include: {
              _count: {
                select: {
                  students: true
                }
              },
              sections: {
                include: {
                  sessions: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      }) as CourseDB | null;

      console.log('Course fetch successful:', { 
        courseId, 
        hasSessions: Boolean(course?.sessions && course.sessions.length > 0),
        hasBatches: Boolean(course?.batches && course.batches.length > 0)
      });
    } catch (error) {
      console.error('Error in course fetch:', error);
      
      let statusCode = 500;
      let errorResponse: Record<string, unknown> = {
        error: 'Failed to fetch course',
        message: 'Failed to fetch course'
      };

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma Known Error:', {
          code: error.code,
          message: error.message,
          meta: error.meta
        });
        errorResponse = {
          error: `Database error: ${error.code}`,
          message: error.message,
          code: error.code
        };
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        console.error('Prisma Validation Error:', error.message);
        errorResponse = {
          error: 'Invalid database query',
          message: error.message
        };
      } else if (error instanceof Prisma.PrismaClientInitializationError) {
        console.error('Prisma Init Error:', error.message);
        errorResponse = {
          error: 'Database connection error',
          message: error.message
        };
      } else if (error instanceof Error) {
        console.error('Generic Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        errorResponse = {
          error: error.message || 'An unexpected error occurred',
          message: error.message || 'An unexpected error occurred',
          type: error.name
        };
      }

      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = (error as Error).stack;
      }

      // Ensure we don't send an empty object; serialize safely and log
      try {
        const payload = Object.keys(errorResponse).length ? errorResponse : { error: 'Failed to fetch course', message: 'Failed to fetch course' };
        const text = JSON.stringify(payload);
        console.error('Returning error response JSON:', text);
        return new NextResponse(text, {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (serr) {
        console.error('Error serializing error response:', serr);
        return NextResponse.json({ error: 'Failed to fetch course', message: 'Failed to fetch course' }, { status: 500 });
      }
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check access rights
    const isAdmin = user.role === 'ADMIN'
    const isInstructor = user.role === 'INSTRUCTOR'
    const isCreator = (course?.creatorId ?? '') === user.id

    // Admin can access any course
    if (isAdmin) {
      console.log('Admin access granted')
    } 
    // Instructor can access their own courses
    else if (isInstructor && isCreator) {
      console.log('Instructor access granted - own course')
    }
    // Anyone can access published courses
    else if (course.isPublished) {
      console.log('Public access granted - published course')
    }
    // Deny access in all other cases
    else {
      console.log('Access denied', { isAdmin, isInstructor, isCreator, isPublished: course.isPublished })
      return NextResponse.json(
        { error: 'You do not have access to this course' },
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
    const enrolledBatchIds = enrollments.map(e => e.batchId).filter((id): id is string => id !== null)


    // Get progress for each session if user is enrolled
    const finalSessions = isEnrolled
      ? await Promise.all(
          ((course?.sessions ?? []) as unknown[]).map(async (s) => {
            const session = s as { id: string; [key: string]: unknown }
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
      : (course?.sessions ?? [])

    const courseWithProgress = {
      ...course,
      sessions: finalSessions
    }

    // Return structured response with progress
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

export async function PUT(request: NextRequest, context: HandlerContext<{ id: string }>) {
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

    const params = (await context.params) as { id: string }
    const courseId = params.id

    const body = (await request.json()) as {
      title?: string
      description?: string
      thumbnail?: string | null
      isPublished?: boolean
    }

    const { title, description, thumbnail, isPublished } = body

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

export async function DELETE(request: NextRequest, context: HandlerContext<{ id: string }>) {
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

  const params = (await context.params) as { id: string }
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
