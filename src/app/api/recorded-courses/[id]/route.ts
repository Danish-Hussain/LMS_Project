import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value || null
    const user = token ? await verifyToken(token) : null
    const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))

    const recordedCourse = await prisma.recordedCourse.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            description: true,
            creator: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!recordedCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Gate unpublished visibility: only admins/instructors may view
    if (!recordedCourse.isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(recordedCourse)
  } catch (error) {
    console.error('Error fetching recorded course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recorded course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params
  const body = await request.json()
  const { name, description, price, isPublished, discountPercent } = body

    const recordedCourse = await prisma.recordedCourse.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(discountPercent !== undefined && { discountPercent: Math.max(0, Math.min(100, Number(discountPercent))) }),
        ...(isPublished !== undefined && { isPublished }),
      },
    })

    return NextResponse.json(recordedCourse)
  } catch (error) {
    console.error('Error updating recorded course:', error)
    return NextResponse.json(
      { error: 'Failed to update recorded course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Look up the recorded course to find its parent courseId
    const rc = await prisma.recordedCourse.findUnique({
      where: { id },
      select: { courseId: true }
    })

    if (!rc) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // If there are other recorded-course entries for the same parent course,
    // we won't delete shared sections/sessions. Only clean up when this is the last one.
    const siblings = await prisma.recordedCourse.count({
      where: { courseId: rc.courseId, NOT: { id } }
    })

    await prisma.$transaction(async (tx) => {
      if (siblings === 0) {
        // Fetch section ids that belong to the parent course and are not tied to a live batch (batchId is null)
        const sections = await tx.courseSection.findMany({
          where: { courseId: rc.courseId, batchId: null },
          select: { id: true }
        })
        const sectionIds = sections.map((s) => s.id)

        if (sectionIds.length > 0) {
          // Delete sessions under these sections first to satisfy FK constraints
          await tx.session.deleteMany({ where: { sectionId: { in: sectionIds } } })
          // Then delete the sections
          await tx.courseSection.deleteMany({ where: { id: { in: sectionIds } } })
        }
      }

      // Finally delete the recorded-course entry itself
      await tx.recordedCourse.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recorded course:', error)
    return NextResponse.json(
      { error: 'Failed to delete recorded course' },
      { status: 500 }
    )
  }
}
