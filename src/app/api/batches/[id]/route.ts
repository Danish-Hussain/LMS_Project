import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

export async function GET(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

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

  const params = (await context.params) as { id: string }
  const { id: batchId } = params

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true
          }
        },
        sections: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        sessions: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true,
            startTime: true,
            endTime: true,
            courseId: true,
            batchId: true,
            sectionId: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            students: true,
            enrollments: true
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Batch fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

  const params = (await context.params) as { id: string }
  const { id: batchId } = params
    const { name, description, startDate, endDate, isActive } = await request.json()

    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isActive
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        sessions: {
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true,
            startTime: true,
            endTime: true,
            courseId: true,
            batchId: true,
            sectionId: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            students: true,
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json(updatedBatch)
  } catch (error) {
    console.error('Batch update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

  const params = (await context.params) as { id: string }
  const { id: batchId } = params

    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    await prisma.batch.delete({
      where: { id: batchId }
    })

    return NextResponse.json({ message: 'Batch deleted successfully' })
  } catch (error) {
    console.error('Batch deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



