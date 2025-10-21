import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, courseName, description, price } = body

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // If no name provided, derive from parent course title
    let finalName = (courseName && String(courseName).trim()) || ''
    if (!finalName) {
      const parent = await prisma.recordedCourse.findFirst({ where: { courseId } }).catch(() => null)
      // Try reading Course title if needed
      if (!parent) {
        try {
          const course = await (prisma as any).course.findUnique({ where: { id: courseId }, select: { title: true } })
          if (course?.title) finalName = `${course.title} — On‑demand`
        } catch (_) {
          // swallow; fallback below
        }
      }
      if (!finalName) finalName = 'Self‑paced Course'
    }

    // Create recorded course
    const recordedCourse = await prisma.recordedCourse.create({
      data: {
        courseId,
        name: finalName,
        description: (description ?? null) as string | null,
        price: price ? parseFloat(price) : 0,
        isPublished: true,
      },
    })

    return NextResponse.json(recordedCourse, { status: 201 })
  } catch (error) {
    console.error('Error creating recorded course:', error)
    return NextResponse.json(
      { error: 'Failed to create recorded course' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = request.cookies.get('auth-token')?.value || null
    const user = token ? await verifyToken(token) : null
    const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))
    const courseId = searchParams.get('courseId')
    const published = searchParams.get('published')

    // Build where clause
    const whereClause: any = {}
    
    if (courseId) {
      whereClause.courseId = courseId
    }
    
    // Non-admins see only published; admins can override via query or see all
    if (!isAdmin) {
      whereClause.isPublished = true
    } else if (published === 'true') {
      whereClause.isPublished = true
    }

    const recordedCourses = await prisma.recordedCourse.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(recordedCourses)
  } catch (error) {
    console.error('Error fetching recorded courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recorded courses' },
      { status: 500 }
    )
  }
}
