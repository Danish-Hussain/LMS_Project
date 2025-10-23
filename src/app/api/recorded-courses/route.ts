import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, courseName, description, price, discountPercent } = body

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // If no name provided, derive from parent course title
    let finalName = (courseName && String(courseName).trim()) || ''
    if (!finalName) {
      const parent = await prisma.recordedCourse.findFirst({ where: { courseId } }).catch(() => null)
      // Try reading Course title if needed
      if (!parent) {
        try {
          const course = await (prisma as any).course.findUnique({ where: { id: courseId }, select: { title: true } })
          if (course?.title) finalName = `${course.title} — On‑demand`
        } catch (_) {
          // swallow; fallback below
        }
      }
      if (!finalName) finalName = 'Self‑paced Course'
    }

    // Validate and normalize input
    const normalizedPrice = (price !== undefined && price !== null && String(price) !== '')
      ? Math.max(0, Math.round(Number(price) * 100) / 100)
      : 0

    let normalizedDiscount: number | undefined = undefined
    if (discountPercent !== undefined && discountPercent !== null && String(discountPercent) !== '') {
      const dp = Number(discountPercent)
      if (Number.isNaN(dp)) {
        return NextResponse.json({ error: 'Discount must be a valid number' }, { status: 400 })
      }
      if (dp < 0 || dp > 100) {
        return NextResponse.json({ error: 'Discount must be between 0 and 100' }, { status: 400 })
      }
      normalizedDiscount = Math.round(dp * 100) / 100
    }

    // Create recorded course with fallback if Prisma Client doesn't know discountPercent yet
    let recordedCourse
    try {
      recordedCourse = await prisma.recordedCourse.create({
        data: {
          courseId,
          name: finalName,
          description: (description ?? null) as string | null,
          price: normalizedPrice,
          isPublished: true,
          ...(normalizedDiscount !== undefined ? { discountPercent: normalizedDiscount } : {}),
        },
      })
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      const unknownArg = msg.includes('Unknown argument `discountPercent`')
      if (!unknownArg) throw e
      // Retry without discount and patch via raw SQL
      recordedCourse = await prisma.recordedCourse.create({
        data: {
          courseId,
          name: finalName,
          description: (description ?? null) as string | null,
          price: normalizedPrice,
          isPublished: true,
        },
      })
      if (normalizedDiscount !== undefined) {
        try {
          await prisma.$executeRaw`UPDATE recorded_courses SET discountPercent = ${normalizedDiscount} WHERE id = ${recordedCourse.id}`
          ;(recordedCourse as any).discountPercent = normalizedDiscount
        } catch (rawErr) {
          console.warn('Failed to set recorded discount via raw SQL:', rawErr)
        }
      }
    }

  return NextResponse.json({ success: true, data: recordedCourse, id: recordedCourse.id }, { status: 201, headers: { Location: `/recorded-courses/${recordedCourse.id}` } })
  } catch (error) {
    console.error('Error creating recorded course:', error)
    return NextResponse.json(
      { error: 'Failed to create recorded course' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = request.cookies.get('auth-token')?.value || null
    const user = token ? await verifyToken(token) : null
    const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))
    const courseId = searchParams.get('courseId')
    const published = searchParams.get('published')

    // Build where clause
    const whereClause: any = {}
    
    if (courseId) {
      whereClause.courseId = courseId
    }
    
    // Non-admins see only published; admins can override via query or see all
    if (!isAdmin) {
      whereClause.isPublished = true
    } else if (published === 'true') {
      whereClause.isPublished = true
    }

    // Build a safe include block
    const includeBlock: any = {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    }

    // Try to include discountPercent directly; if Prisma Client is outdated,
    // retry without it and then fetch via raw SQL.
    let recordedCourses: any[]
    try {
      recordedCourses = await prisma.recordedCourse.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isPublished: true,
          createdAt: true,
          courseId: true,
          discountPercent: true,
          course: includeBlock.course,
        } as any,
      })
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      const unknownField = msg.includes('Unknown field `discountPercent`')
      if (!unknownField) throw e
      // Retry without discountPercent and fetch it via raw SQL
      const base = await prisma.recordedCourse.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isPublished: true,
          createdAt: true,
          courseId: true,
          course: includeBlock.course,
        } as any,
      })
      const ids = base.map((c: any) => c.id)
      let dmap = new Map<string, number>()
      if (ids.length) {
        try {
          const rows = await prisma.$queryRaw<Array<{ id: string; discountPercent: number | null }>>`
            SELECT id, discountPercent FROM recorded_courses
            WHERE id IN (${Prisma.join(ids)})
          `
          dmap = new Map(rows.map(r => [r.id, typeof r.discountPercent === 'number' ? r.discountPercent : 0]))
        } catch (rawErr) {
          console.warn('Failed to fetch recorded discountPercent via raw SQL:', rawErr)
        }
      }
      recordedCourses = base.map((c: any) => ({ ...c, discountPercent: dmap.get(c.id) ?? 0 }))
    }

    return NextResponse.json(recordedCourses)
  } catch (error) {
    console.error('Error fetching recorded courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recorded courses' },
      { status: 500 }
    )
  }
}
