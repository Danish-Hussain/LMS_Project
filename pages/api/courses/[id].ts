import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Course ID is required' })

  if (req.method === 'GET') {
    try {
      const isPublic = req.query.public === '1' || req.query.public === 'true'
      const token = req.cookies['auth-token']

      // Public preview (guests) when explicitly requested
      if (!token && isPublic) {
        const course: any = await prisma.course.findUnique({
          where: { id },
          include: {
            creator: { select: { id: true, name: true } },
            sessions: {
              where: { courseId: id },
              orderBy: { order: 'asc' },
              select: { id: true, title: true, videoUrl: true, order: true, isPublished: true, isPreview: true as any } as any,
            },
            batches: {
              where: { isActive: true },
              select: { id: true, name: true, isActive: true, _count: { select: { students: true } } },
            },
            _count: { select: { enrollments: true } },
          },
        })

        if (!course) return res.status(404).json({ error: 'Course not found' })
        if (!course.isPublished) return res.status(403).json({ error: 'Course not available' })

        // Ensure discountPercent (fallback via raw SQL if missing)
        let discountPercent = 0
        try {
          const val = (course as any)?.discountPercent
          if (typeof val === 'number' && isFinite(val)) {
            discountPercent = Math.max(0, Math.min(100, val))
          } else {
            const rows = await prisma.$queryRaw<Array<{ discountPercent: number | null }>>`SELECT discountPercent FROM courses WHERE id = ${id} LIMIT 1`
            const raw = rows?.[0]?.discountPercent
            discountPercent = typeof raw === 'number' ? Math.max(0, Math.min(100, raw)) : 0
          }
        } catch {
          discountPercent = 0
        }

        const safeSessions = (course.sessions || []).map((s: any) => {
          const isPreview = Boolean(s.isPreview)
          const isVimeo = typeof s.videoUrl === 'string' && /vimeo\.com/.test(s.videoUrl)
          return {
            id: s.id,
            title: s.title,
            order: s.order,
            isPublished: s.isPublished,
            videoUrl: isPreview && isVimeo ? s.videoUrl : null,
            isPreview,
          }
        })

        return res.status(200).json({
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            price: course.price,
            discountPercent,
            isPublished: true,
            creator: course.creator,
            _count: course._count,
            sessions: safeSessions,
            batches: course.batches,
          },
          isEnrolled: false,
          enrolledBatchIds: [],
          enrolledRecordedCourseIds: [],
        })
      }

      if (!token) return res.status(401).json({ error: 'Not authenticated' })
      const user = await verifyToken(token).catch(() => null) as any
      if (!user) return res.status(401).json({ error: 'Invalid authentication' })

      // Fetch course with related data
      const batchOr: Prisma.BatchWhereInput[] = [
        { isActive: true },
        { courseId: id },
        ...(user.role === 'ADMIN' ? ([{}] as Prisma.BatchWhereInput[]) : []),
      ]

      const exists = await prisma.course.findUnique({ where: { id }, select: { id: true } })
      if (!exists) return res.status(404).json({ error: 'Course not found' })

      const course: any = await prisma.course.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true } },
          sessions: { where: { courseId: id }, orderBy: { order: 'asc' } },
          batches: {
            where: { OR: batchOr },
            include: {
              _count: { select: { students: true } },
              sections: { include: { sessions: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
      })

      if (!course) return res.status(404).json({ error: 'Course not found' })

      const isAdmin = user.role === 'ADMIN'
      const isInstructor = user.role === 'INSTRUCTOR'
      const isCreator = (course?.creatorId ?? '') === user.id
      if (!(isAdmin || (isInstructor && isCreator) || course.isPublished)) {
        return res.status(403).json({ error: 'You do not have access to this course' })
      }

      // Attach discount percent if missing
      try {
        const val = (course as any)?.discountPercent
        if (!(typeof val === 'number' && isFinite(val))) {
          const rows = await prisma.$queryRaw<Array<{ discountPercent: number | null }>>`SELECT discountPercent FROM courses WHERE id = ${course.id} LIMIT 1`
          const raw = rows?.[0]?.discountPercent
          ;(course as any).discountPercent = typeof raw === 'number' ? Math.max(0, Math.min(100, raw)) : 0
        } else {
          ;(course as any).discountPercent = Math.max(0, Math.min(100, val))
        }
      } catch {
        ;(course as any).discountPercent = 0
      }

      const enrollments = await prisma.enrollment.findMany({ where: { courseId: course.id, userId: user.id }, select: { batchId: true } })
      const isEnrolled = enrollments.length > 0
      const enrolledBatchIds = enrollments.map(e => e.batchId).filter((v): v is string => !!v)

      const recordedCourseEnrollments = await prisma.recordedCourseEnrollment.findMany({
        where: { userId: user.id, recordedCourse: { courseId: course.id } },
        select: { recordedCourseId: true },
      })
      const enrolledRecordedCourseIds = recordedCourseEnrollments.map(e => e.recordedCourseId)

      // Progress for sessions if enrolled
      const finalSessions = isEnrolled
        ? await Promise.all(
            (course.sessions || []).map(async (s: any) => {
              const progress = await prisma.progress.findFirst({ where: { userId: user.id, sessionId: s.id } })
              return { ...s, progress }
            })
          )
        : (course.sessions || [])

      const courseWithProgress = { ...course, sessions: finalSessions }
      return res.status(200).json({
        course: courseWithProgress,
        isEnrolled,
        enrolledBatchIds,
        enrolledRecordedCourseIds,
      })
    } catch (error) {
      console.error('Pages API courses/:id GET error:', error)
      return res.status(500).json({ error: 'Failed to fetch course' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const token = req.cookies['auth-token']
      if (!token) return res.status(401).json({ error: 'Not authenticated' })
      const user = await verifyToken(token).catch(() => null) as any
      if (!user || !['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      const course = await prisma.course.findUnique({ where: { id } })
      if (!course) return res.status(404).json({ error: 'Course not found' })
      if (user.role !== 'ADMIN' && course.creatorId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      const body = (req.body || {}) as {
        title?: string
        description?: string
        thumbnail?: string | null
        isPublished?: boolean
        price?: number | string | null
        discountPercent?: number | string | null
      }

      // Validate thumbnail when provided
      if (body.thumbnail !== undefined && body.thumbnail !== null) {
        if (typeof body.thumbnail !== 'string') {
          return res.status(400).json({ error: 'Thumbnail must be a URL string' })
        }
        const thumb = body.thumbnail.trim()
        if (thumb.length > 0) {
          const isAppRelative = thumb.startsWith('/')
          if (!isAppRelative) {
            try {
              const parsed = new URL(thumb)
              if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol')
            } catch {
              return res.status(400).json({ error: 'Thumbnail must be a valid URL starting with http:// or https:// or an app relative path like /uploads/…' })
            }
          }
        }
      }

      const price = body.price !== undefined && body.price !== null && body.price !== '' ? Number(body.price) : undefined
      const discountPercent = body.discountPercent !== undefined && body.discountPercent !== null && body.discountPercent !== ''
        ? Math.max(0, Math.min(100, Number(body.discountPercent)))
        : undefined

      const updated = await prisma.course.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
          thumbnail: body.thumbnail,
          isPublished: body.isPublished,
          ...(price !== undefined ? { price } : {}),
          ...(discountPercent !== undefined ? { discountPercent } : {}),
        },
        include: {
          creator: { select: { name: true } },
          sessions: true,
          _count: { select: { enrollments: true } },
        },
      })

      return res.status(200).json(updated)
    } catch (error) {
      console.error('Pages API courses/:id PUT error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const token = req.cookies['auth-token']
      if (!token) return res.status(401).json({ error: 'Not authenticated' })
      const user = await verifyToken(token).catch(() => null) as any
      if (!user || !['ADMIN', 'INSTRUCTOR'].includes(user.role)) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      const course = await prisma.course.findUnique({ where: { id } })
      if (!course) return res.status(404).json({ error: 'Course not found' })
      if (user.role !== 'ADMIN' && course.creatorId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      await prisma.course.delete({ where: { id } })
      return res.status(200).json({ success: true, message: 'Course deleted successfully' })
    } catch (error) {
      console.error('Pages API courses/:id DELETE error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE')

  return res.status(405).json({ error: 'Method Not Allowed' })
}
