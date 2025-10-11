import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

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
        description: true,
        videoUrl: true,
        duration: true,
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
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { title, description, videoUrl, duration, sectionId } = await request.json()
    const { id } = await params

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
        description,
        videoUrl,
        duration,
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