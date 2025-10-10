import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Allow public access to published courses.
    // If an auth-token is present and valid, return all courses for admins/instructors.
    const token = request.cookies.get('auth-token')?.value
    let user = null
    if (token) {
      try {
        user = verifyToken(token)
      } catch (e) {
        user = null
      }
    }

    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')

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

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { title, description, thumbnail, price } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail,
        price: price ? parseFloat(price) : null,
        isPublished: true,
        creatorId: user.id
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

    return NextResponse.json(course)
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
