import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const sections = await prisma.courseSection.findMany({
      where: {
        batchId: params.id
      },
      include: {
        sessions: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(sections)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('User role:', user.role)
    
    if (!['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: `Not authorized. Required role: ADMIN or INSTRUCTOR. Current role: ${user.role}` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, courseId } = body

    console.log('Received body:', body)

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Verify that the batch exists and belongs to the course
    const batch = await prisma.batch.findUnique({
      where: {
        id: params.id,
        courseId: courseId
      }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Invalid batch or course ID' },
        { status: 404 }
      )
    }

    // Get the highest order number
    const lastSection = await prisma.courseSection.findFirst({
      where: { batchId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    // Create the new section
    const section = await prisma.courseSection.create({
      data: {
        title,
        description,
        batchId: params.id,
        courseId,
        order: (lastSection?.order ?? 0) + 1
      },
      include: {
        sessions: true
      }
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
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

    const user = verifyToken(token)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { sections } = body

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Invalid sections data' },
        { status: 400 }
      )
    }

    // Update section orders in a transaction
    await prisma.$transaction(
      sections.map((section) =>
        prisma.courseSection.update({
          where: { id: section.id },
          data: { order: section.order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating sections:', error)
    return NextResponse.json(
      { error: 'Failed to update sections' },
      { status: 500 }
    )
  }
}