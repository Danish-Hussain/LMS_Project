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
  const { id: sessionId } = params

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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
        updatedAt: true,
        batch: {
          select: {
            id: true,
            name: true,
            course: {
              select: { title: true }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Session fetch error:', error)
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
  const { id: sessionId } = params
    const body = await request.json()

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Build update data only with provided fields to avoid accidentally clearing values
  const updateData: Record<string, unknown> = {}
    if (typeof body.title !== 'undefined') updateData.title = body.title
    if (typeof body.videoUrl !== 'undefined') updateData.videoUrl = body.videoUrl
    if (typeof body.order !== 'undefined') updateData.order = parseInt(body.order)
    if (typeof body.isPublished !== 'undefined') updateData.isPublished = body.isPublished

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Session update error:', error)
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
    const { id: sessionId } = params

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    await prisma.session.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



