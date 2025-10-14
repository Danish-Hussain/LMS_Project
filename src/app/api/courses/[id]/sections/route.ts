import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

export async function GET(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

  const params = (await context.params) as { id: string }
  const { id } = params
    const sections = await prisma.courseSection.findMany({
      where: {
        courseId: id,
        batchId: batchId
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

export async function POST(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user || !['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

  const body = (await request.json()) as { title?: string; description?: string; batchId?: string }
  const { title, description, batchId } = body

    // Validate required fields
    if (!title || !batchId) {
      return NextResponse.json(
        { error: 'Title and batch ID are required' },
        { status: 400 }
      )
    }

    // Get the highest order number
  const params = (await context.params) as { id: string }
  const { id } = params
    const lastSection = await prisma.courseSection.findFirst({
      where: {
        courseId: id,
        batchId: batchId
      },
      orderBy: {
        order: 'desc'
      }
    })

    const order = lastSection ? lastSection.order + 1 : 1

    const section = await prisma.courseSection.create({
      data: {
        title,
        description,
        order,
        courseId: id,
        batchId
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