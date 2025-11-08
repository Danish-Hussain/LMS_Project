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

    // If an order change is requested, perform a scoped swap within the same section (if any) or batch.
    // This avoids duplicate orders appearing to do nothing in the UI.
  const wantsOrderChange = typeof body.order !== 'undefined'
  const wantsSectionChange = typeof body.sectionId !== 'undefined'

    // Build update payload for non-order fields first
    const baseUpdate: Record<string, unknown> = {}
    if (typeof body.title !== 'undefined') baseUpdate.title = body.title
    if (typeof body.videoUrl !== 'undefined') baseUpdate.videoUrl = body.videoUrl
    if (typeof body.isPublished !== 'undefined') baseUpdate.isPublished = body.isPublished

    // Handle section change (validate belongs to same batch) before reordering logic
    if (wantsSectionChange) {
      if (body.sectionId === null || body.sectionId === '') {
        // Unassign from section
        baseUpdate.sectionId = null
      } else if (typeof body.sectionId === 'string') {
        const section = await prisma.courseSection.findUnique({
          where: { id: body.sectionId },
          select: { id: true, batchId: true }
        })
        if (!section) {
          return NextResponse.json({ error: 'Section not found' }, { status: 404 })
        }
        if (section.batchId !== session.batchId) {
          return NextResponse.json({ error: 'Section does not belong to this session\'s batch' }, { status: 400 })
        }
        baseUpdate.sectionId = section.id
      }
    }

    let updatedSession

    if (wantsOrderChange) {
      const requestedOrderRaw = parseInt(String(body.order))
      if (!Number.isFinite(requestedOrderRaw)) {
        return NextResponse.json({ error: 'Invalid order value' }, { status: 400 })
      }

      // Scope depends on (potentially changed) section
      const effectiveSectionId = wantsSectionChange ? (baseUpdate.sectionId as string | null) : session.sectionId
      const scopeWhere: Record<string, unknown> = effectiveSectionId
        ? { sectionId: effectiveSectionId }
        : { batchId: session.batchId }

      // Fetch all sessions in scope ordered asc to reason about positions
      const scopedSessions = await prisma.session.findMany({
        where: scopeWhere,
        orderBy: { order: 'asc' },
        select: { id: true, order: true }
      })

      // Normalise bounds
      const maxPos = scopedSessions.length
      let targetOrder = requestedOrderRaw
      if (targetOrder < 1) targetOrder = 1
      if (targetOrder > maxPos) targetOrder = maxPos

      if (targetOrder !== session.order) {
        // Find any session currently occupying targetOrder
        const occupying = scopedSessions.find(s => s.order === targetOrder)
        // Swap orders if someone already has desired position
        if (occupying) {
          // If section changed, session.order relevance changes; recalc swap using previous order if still in same scope
          const previousOrderForSwap = session.order
          await prisma.$transaction([
            prisma.session.update({ where: { id: occupying.id }, data: { order: previousOrderForSwap } }),
            prisma.session.update({ where: { id: session.id }, data: { order: targetOrder, ...baseUpdate } })
          ])
        } else {
          // Hole: just set the new order
          await prisma.session.update({ where: { id: session.id }, data: { order: targetOrder, ...baseUpdate } })
        }
        // After swap, re-fetch updated session for response
        updatedSession = await prisma.session.findUnique({ where: { id: session.id } })
      } else {
        // Order unchanged; just update base fields if any
        if (Object.keys(baseUpdate).length > 0) {
          updatedSession = await prisma.session.update({ where: { id: session.id }, data: baseUpdate })
        } else {
            updatedSession = session
        }
      }
    } else {
      // No order manipulation requested; simple update
      if (Object.keys(baseUpdate).length > 0) {
        updatedSession = await prisma.session.update({ where: { id: session.id }, data: baseUpdate })
      } else {
        updatedSession = session
      }
    }

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



