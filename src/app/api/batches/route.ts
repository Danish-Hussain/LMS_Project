import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const batches = await prisma.batch.findMany({
      include: {
        _count: {
          select: {
            students: true,
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('Batches fetch error:', error)
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

    const { name, description, startDate, endDate, courseId } = await request.json()

    if (!name || !startDate || !courseId) {
      return NextResponse.json(
        { error: 'Name, start date, and course are required' },
        { status: 400 }
      )
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        // when endDate is not provided, omit the field (undefined) so it matches Prisma input types
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        // connect the relation instead of passing the foreign key scalar
        course: {
          connect: { id: courseId }
        }
      },
      include: {
        _count: {
          select: {
            students: true,
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
