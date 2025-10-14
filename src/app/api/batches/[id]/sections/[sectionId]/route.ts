import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

export async function GET(request: NextRequest, context: HandlerContext<{ id: string; sectionId?: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
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

  const params = (await context.params) as { id: string; sectionId?: string }
  const { id } = params
    const sections = await prisma.courseSection.findMany({
      where: {
        batchId: id
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
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: HandlerContext<{ id: string; sectionId?: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get the batch to verify it exists and get courseId
  const params = (await context.params) as { id: string; sectionId?: string }
  const { id } = params
    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { courseId: true }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Get the highest order number
    const lastSection = await prisma.courseSection.findFirst({
      where: { batchId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = lastSection ? lastSection.order + 1 : 1

    const section = await prisma.courseSection.create({
      data: {
        title,
        description,
        order: newOrder,
        batchId: id,
        courseId: batch.courseId
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

export async function PUT(request: NextRequest, context: HandlerContext<{ id: string; sectionId?: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)
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

export async function DELETE(request: NextRequest, context: HandlerContext<{ id: string; sectionId?: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

  const params = (await context.params) as { id: string; sectionId?: string }
  const { id } = params
    await prisma.courseSection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}