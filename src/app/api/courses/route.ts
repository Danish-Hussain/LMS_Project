import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
    console.log('Query condition:', isAdmin ? 'instructor courses' : 'published courses')

    console.log('Executing Prisma query...')
    
    // Build where clause based on user role
    let whereClause: any = { isPublished: true }; // default for non-logged in users
    
    if (user) {
      if (user.role === 'ADMIN') {
        // Admin can see all courses
        whereClause = {};
      } else if (user.role === 'INSTRUCTOR') {
        // Instructors see their own courses
        whereClause = { creatorId: user.id };
      }
    }

    console.log('Where clause:', whereClause)
    
    // Build base select without discountPercent
    const baseSelect: any = {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      isPublished: true,
      creatorId: true,
      creator: {
        select: {
          name: true
        }
      },
      sessions: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          isPublished: true
        }
      },
      _count: {
        select: {
          enrollments: true
        }
      }
    }

    const selectWithDiscount: any = { ...baseSelect, discountPercent: true }

    let courses
    try {
      // Try selecting discountPercent (works if Prisma Client knows the field)
      courses = await prisma.course.findMany({
        where: whereClause,
        select: selectWithDiscount,
        orderBy: { createdAt: 'desc' }
      })
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      const unknownField = msg.includes('Unknown field `discountPercent`')
      if (!unknownField) throw e
      console.warn('Prisma client missing discountPercent in select; retrying without the field')
      const result = await prisma.course.findMany({
        where: whereClause,
        select: baseSelect,
        orderBy: { createdAt: 'desc' }
      })
      // Fetch discountPercent via raw SQL for the returned ids
      const ids = result.map((c: any) => c.id)
      let discountMap = new Map<string, number>()
      if (ids.length) {
        try {
          const rows = await prisma.$queryRaw<Array<{ id: string; discountPercent: number }>>`
            SELECT id, discountPercent FROM courses
            WHERE id IN (${Prisma.join(ids)})
          `
          discountMap = new Map(rows.map(r => [r.id, typeof r.discountPercent === 'number' ? r.discountPercent : 0]))
        } catch (rawErr) {
          console.warn('Failed to fetch discountPercent via raw SQL, defaulting to 0:', rawErr)
        }
      }
      courses = result.map((c: any) => ({ ...c, discountPercent: discountMap.get(c.id) ?? 0 }))
    }

    console.log('Query results:', { count: courses.length, courses: courses.map(c => ({ id: c.id, title: c.title })) })

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
      const resp = { error: 'Not authenticated' }
      console.error('Sending response (early):', resp, 401)
      return NextResponse.json(resp, { status: 401 })
    }

  let user
  try {
    user = await verifyToken(token as string)
    console.log('User verified:', { id: user?.id, role: user?.role })
  } catch (e) {
    console.warn('Token verification failed in POST /api/courses:', e)
    return NextResponse.json({ error: 'Session expired. Please log in again' }, { status: 401 })
  }

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
        const resp = { error: 'User account not found' }
        console.error('Sending response (user not found):', resp, 404)
        return NextResponse.json(resp, { status: 404 })
      }

      if (dbUser.role !== 'ADMIN' && dbUser.role !== 'INSTRUCTOR') {
        console.log('Unauthorized role:', { userId: user.id, role: dbUser.role })
        const resp = { error: 'Only admins and instructors can create courses' }
        console.error('Sending response (unauthorized role):', resp, 403)
        return NextResponse.json(resp, { status: 403 })
      }
    } catch (dbError) {
      console.error('Error verifying user in database:', {
        userId: user.id,
        error: dbError
      })
      const resp = { error: 'Failed to verify user permissions' }
      console.error('Sending response (verify user error):', resp, 500, { dbError })
      return NextResponse.json(resp, { status: 500 })
    }

    let body
    try {
      body = await request.json()
      console.log('Request body:', body)
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      const resp = { error: 'Invalid JSON format in request body' }
      console.error('Sending response (invalid json):', resp, 400)
      return NextResponse.json(resp, { status: 400 })
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
  const { title, description, thumbnail, price, isPublished = true, discountPercent } = body

    // Validate required fields with specific constraints
    if (!title) {
      const resp = { error: 'Title is required' }
      console.error('Sending response (title missing):', resp, 400)
      return NextResponse.json(resp, { status: 400 })
    }

    if (typeof title !== 'string') {
      const resp = { error: 'Title must be a string' }
      console.error('Sending response (title not string):', resp, 400)
      return NextResponse.json(resp, { status: 400 })
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0) {
      const resp = { error: 'Title cannot be empty' }
      console.error('Sending response (title empty):', resp, 400)
      return NextResponse.json(resp, { status: 400 })
    }

    if (trimmedTitle.length > 255) {
      const resp = { error: 'Title cannot exceed 255 characters' }
      console.error('Sending response (title too long):', resp, 400)
      return NextResponse.json(resp, { status: 400 })
    }

    // Validate optional fields
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        const resp = { error: 'Description must be a string' }
        console.error('Sending response (description type):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
    }

    if (thumbnail !== undefined && thumbnail !== null) {
      if (typeof thumbnail !== 'string') {
        const resp = { error: 'Thumbnail must be a URL string' }
        console.error('Sending response (thumbnail type):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
      // Only validate URL if a non-empty string is provided
      const thumb = thumbnail.trim()
      if (thumb.length > 0) {
        // Allow app-relative uploads like /uploads/xyz.png
        const isAppRelative = thumb.startsWith('/')
        if (!isAppRelative) {
          try {
            const parsed = new URL(thumb)
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              throw new Error('invalid protocol')
            }
          } catch (e) {
            const resp = { error: 'Thumbnail must be a valid URL starting with http:// or https:// or an app relative path like /uploads/…' }
            console.error('Sending response (thumbnail url):', resp, 400)
            return NextResponse.json(resp, { status: 400 })
          }
        }
      }
    }

    // Validate and convert price
    let validatedPrice: number | null = null
    if (price !== undefined && price !== null && price !== '') {
      const numPrice = Number(price)
      if (isNaN(numPrice)) {
        const resp = { error: 'Price must be a valid number' }
        console.error('Sending response (price NaN):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
      if (numPrice < 0) {
        const resp = { error: 'Price cannot be negative' }
        console.error('Sending response (price negative):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
      // Round to 2 decimal places to avoid floating point issues
      validatedPrice = Math.round(numPrice * 100) / 100
    }

    // Validate and normalize discountPercent (optional)
    let validatedDiscount: number | undefined = undefined
    if (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') {
      const dp = Number(discountPercent)
      if (isNaN(dp)) {
        const resp = { error: 'Discount must be a valid number' }
        console.error('Sending response (discount NaN):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
      if (dp < 0 || dp > 100) {
        const resp = { error: 'Discount must be between 0 and 100' }
        console.error('Sending response (discount bounds):', resp, 400)
        return NextResponse.json(resp, { status: 400 })
      }
      validatedDiscount = Math.round(dp * 100) / 100
    }

    // Prepare course data with validated fields
    const courseData = {
      title: trimmedTitle,
  description: (typeof description === 'string' && description.trim().length > 0) ? description.trim() : null,
  thumbnail: (typeof thumbnail === 'string' && thumbnail.trim().length > 0) ? thumbnail.trim() : null,
      price: validatedPrice,
      isPublished: Boolean(isPublished),
      ...(validatedDiscount !== undefined ? { discountPercent: validatedDiscount } : {}),
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
  const course = await prisma.$transaction(async (tx) => {
        // Double check user exists within transaction
        const userExists = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true }
        })

        if (!userExists) {
          throw new Error('Creator no longer exists in database')
        }

        // Create the course with a fallback for older Prisma Client (without discountPercent)
        const includeBlock = {
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

        try {
          return await tx.course.create({
            data: courseData,
            include: includeBlock
          })
        } catch (e: any) {
          const msg = typeof e?.message === 'string' ? e.message : ''
          const looksLikeUnknownArg = msg.includes('Unknown argument `discountPercent`')
          if (!looksLikeUnknownArg) throw e

          // Prisma Client not yet regenerated: retry without discountPercent and set it via raw SQL
          const { discountPercent: _dp, ...fallbackData } = courseData as any
          const created = await tx.course.create({
            data: fallbackData,
            include: includeBlock
          })
          if (validatedDiscount !== undefined) {
            try {
              await tx.$executeRaw`UPDATE courses SET discountPercent = ${validatedDiscount} WHERE id = ${created.id}`
              // Reflect discount in the returned object
              ;(created as any).discountPercent = validatedDiscount
            } catch (rawErr) {
              console.warn('Failed to set discountPercent via raw SQL, proceeding without it:', rawErr)
            }
          }
          return created
        }
      })

      console.log('Course created successfully:', {
        id: course.id,
        title: course.title,
        creator: course.creator?.name,
        isPublished: course.isPublished
      })

      return NextResponse.json(
        {
          success: true,
          data: course,
          id: course.id,
          message: 'Course created successfully'
        },
        { status: 201, headers: { Location: `/courses/${course.id}` } }
      )

    } catch (dbError) {
      console.error('Database error during course creation:', {
        error: dbError,
        courseData: { ...courseData, creatorId: '[REDACTED]' }
      })

      if (dbError instanceof Error && dbError.message.includes('Unique constraint failed')) {
        const resp = { error: 'A course with this title already exists' }
        console.error('Sending response (unique constraint):', resp, 409, { dbError })
        return NextResponse.json(resp, { status: 409 })
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
