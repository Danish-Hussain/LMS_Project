import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

export async function GET(request: Request, context: HandlerContext<{ id: string }>) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

  const user = await verifyToken(token)

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

  const params = (await context.params) as { id: string }
  const { id } = params

    const sessions = await prisma.session.findMany({
      where: {
        batchId: id
      },
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        startTime: true,
        endTime: true,
        order: true,
        isPublished: true,
        sectionId: true,
        courseId: true,
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('[SESSIONS_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, context: HandlerContext<{ id: string }>) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

  const user = await verifyToken(token)

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

      const { title, videoUrl, startTime, endTime, sectionId } = await request.json()
  const params = (await context.params) as { id: string }
  const { id } = params

    // Ensure batch exists and get courseId for required relation
    const batch = await prisma.batch.findUnique({ where: { id } })
    if (!batch) {
      return new NextResponse('Batch not found', { status: 404 })
    }

    // Get the last session order number for this batch
    const lastSession = await prisma.session.findFirst({
      where: {
        batchId: id
      },
      orderBy: {
        order: 'desc'
      },
      select: {
        order: true
      }
    })

    const newOrder = (lastSession?.order || 0) + 1

    const newSession = await prisma.session.create({
      data: {
        title,
        videoUrl,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        order: newOrder,
        isPublished: false,
        batchId: id,
        courseId: batch.courseId,
        sectionId
      }
    })

    return NextResponse.json(newSession)
  } catch (error) {
    console.error('[SESSIONS_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}