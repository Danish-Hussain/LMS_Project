import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// List all sections (admin/instructor can also use batch/course-specific endpoints)
export async function GET(request: NextRequest) {
	try {
		const sections = await prisma.courseSection.findMany({
			include: { sessions: { orderBy: { order: 'asc' } } },
			orderBy: { order: 'asc' }
		})

		return NextResponse.json(sections)
	} catch (error) {
		console.error('Failed to fetch sections:', error)
		return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
	}
}

// Create a new section (requires ADMIN or INSTRUCTOR)
export async function POST(request: NextRequest) {
	try {
		const token = request.cookies.get('auth-token')?.value
		if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

		const user = verifyToken(token)
		if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

		if (!['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
			return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
		}

		const body = await request.json()
		const { title, description, courseId, batchId } = body

		if (!title || typeof title !== 'string') {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 })
		}
		if (!courseId || typeof courseId !== 'string') {
			return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
		}
		if (!batchId || typeof batchId !== 'string') {
			return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
		}

		// get last order in the batch
		const last = await prisma.courseSection.findFirst({
			where: { batchId },
			orderBy: { order: 'desc' },
			select: { order: true }
		})

		const section = await prisma.courseSection.create({
			data: {
				title,
				description,
				courseId,
				batchId,
				order: (last?.order ?? 0) + 1
			},
			include: { sessions: true }
		})

		return NextResponse.json(section)
	} catch (error) {
		console.error('Error creating section:', error)
		return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
	}
}
