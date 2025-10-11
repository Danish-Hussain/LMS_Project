import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/courses - Starting request')
    // Allow public access to published courses.
    // If an auth-token is present and valid, return all courses for admins/instructors.
    const token = request.cookies.get('auth-token')?.value
    console.log('Token present:', !!token)
    
    let user = null
    if (token) {
      try {
        user = await verifyToken(token as string)
        console.log('User verified:', { role: user?.role, id: user?.id })
      } catch (e) {
        console.log('Token verification failed:', e)
        user = null
      }
    }

    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')
    console.log('Is admin/instructor:', isAdmin)
    
    // Log query condition
    console.log('Query condition:', isAdmin ? 'all courses' : 'only published courses')

    console.log('Executing Prisma query...')
    const courses = await prisma.course.findMany({
      where: isAdmin ? {} : { isPublished: true },
      include: {
        creator: {
          select: {
            name: true
          }
        },
        sessions: {
          select: {
            id: true,
            title: true,
            duration: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log('Query results:', { count: courses.length, courses: courses.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Courses fetch error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/courses - Starting request')
    const token = request.cookies.get('auth-token')?.value
    console.log('Auth token present:', !!token)

    if (!token) {
      console.log('No auth token found')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token as string)
  console.log('User verified:', { id: user?.id, role: user?.role })

    if (!user || !user.id) {
      console.log('Invalid user data:', { user })
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      )
    }

    // Verify user exists in database and has correct role
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true }
      })

      if (!dbUser) {
        console.log('User not found in database:', { userId: user.id })
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 404 }
        )
      }

      if (dbUser.role !== 'ADMIN' && dbUser.role !== 'INSTRUCTOR') {
        console.log('Unauthorized role:', { userId: user.id, role: dbUser.role })
        return NextResponse.json(
          { error: 'Only admins and instructors can create courses' },
          { status: 403 }
        )
      }
    } catch (dbError) {
      console.error('Error verifying user in database:', {
        userId: user.id,
        error: dbError
      })
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
      console.log('Request body:', body)
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      )
    }

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      console.log('Invalid request body structure:', body)
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      )
    }

    // Extract and validate all fields
    const { title, description, thumbnail, price, isPublished = true } = body

    // Validate required fields with specific constraints
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title must be a string' },
        { status: 400 }
      )
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0) {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedTitle.length > 255) {
      return NextResponse.json(
        { error: 'Title cannot exceed 255 characters' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string' },
          { status: 400 }
        )
      }
    }

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

    // Validate and convert price
    let validatedPrice: number | null = null
    if (price !== undefined && price !== null && price !== '') {
      const numPrice = Number(price)
      if (isNaN(numPrice)) {
        return NextResponse.json(
          { error: 'Price must be a valid number' },
          { status: 400 }
        )
      }
      if (numPrice < 0) {
        return NextResponse.json(
          { error: 'Price cannot be negative' },
          { status: 400 }
        )
      }
      // Round to 2 decimal places to avoid floating point issues
      validatedPrice = Math.round(numPrice * 100) / 100
    }

    // Prepare course data with validated fields
    const courseData = {
      title: trimmedTitle,
      description: description?.trim() || null,
      thumbnail: thumbnail || null,
      price: validatedPrice,
      isPublished: Boolean(isPublished),
      creatorId: user.id
    }

    console.log('Creating course with validated data:', courseData)

    try {
      // Log the course data being created
      console.log('Creating course with data:', {
        ...courseData,
        creatorId: user.id
      })

      // Use a transaction to ensure data consistency
  const course = await prisma.$transaction(async (tx: any) => {
        // Double check user exists within transaction
        const userExists = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true }
        })

        if (!userExists) {
          throw new Error('Creator no longer exists in database')
        }

        // Create the course
        return await tx.course.create({
          data: courseData,
          include: {
            creator: {
              select: {
                name: true,
                email: true
              }
            },
            sessions: true,
            _count: {
              select: {
                enrollments: true,
                sessions: true
              }
            }
          }
        })
      })

      console.log('Course created successfully:', {
        id: course.id,
        title: course.title,
        creator: course.creator?.name,
        isPublished: course.isPublished
      })

      return NextResponse.json({
        success: true,
        data: course,
        message: 'Course created successfully'
      })

    } catch (dbError) {
      console.error('Database error during course creation:', {
        error: dbError,
        courseData: { ...courseData, creatorId: '[REDACTED]' }
      })

      if (dbError instanceof Error && dbError.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'A course with this title already exists' },
          { status: 409 }
        )
      }

      throw dbError // Let the outer catch handle other database errors
    }
  } catch (error) {
    console.error('Course creation error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : String(error)
    })

    // Return appropriate error based on the type
    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes('foreign key constraint failed')) {
        return NextResponse.json(
          { 
            error: 'Invalid creator ID provided',
            details: error.message
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          {
            error: 'A course with this title already exists',
            details: error.message
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Failed to create course',
          message: error.message,
          details: error.stack
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while creating the course',
        details: String(error)
      },
      { status: 500 }
    )
  }
}
