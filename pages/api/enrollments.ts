import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const user = await verifyToken(token).catch(() => null) as any
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  if (req.method === 'POST') {
    try {
      const { courseId, batchId } = req.body || {}
      if (!courseId) return res.status(400).json({ error: 'Course ID is required' })

      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return res.status(404).json({ error: 'Course not found' })
      if (!course.isPublished) return res.status(403).json({ error: 'Course is not published' })

      const existing = await prisma.enrollment.findFirst({ where: { userId: user.id, courseId, batchId } })
      if (existing) return res.status(409).json({ error: 'Already enrolled in this course' })

      if (batchId) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId } })
        if (!batch) return res.status(400).json({ error: 'Batch not found' })
        if (batch.courseId !== courseId) return res.status(400).json({ error: 'Batch does not belong to the specified course' })

        const targetSessions = await prisma.session.findMany({ where: { batchId }, select: { startTime: true, endTime: true } }) as any[]
        if (targetSessions.length > 0) {
          const userEnrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, include: { batch: { include: { sessions: { select: { startTime: true, endTime: true } } } } } })
          const hasConflict = userEnrollments.some((enr: any) => {
            const other = enr.batch?.sessions || []
            return other.some((os: any) => {
              if (!os.startTime || !os.endTime) return false
              return targetSessions.some((ts: any) => {
                if (!ts.startTime || !ts.endTime) return false
                const tsStart = new Date(ts.startTime)
                const tsEnd = new Date(ts.endTime)
                const osStart = new Date(os.startTime)
                const osEnd = new Date(os.endTime)
                return tsStart < osEnd && osStart < tsEnd
              })
            })
          })
          if (hasConflict) return res.status(409).json({ error: 'Schedule conflict with another enrolled batch' })
        }
      }

      const record: Record<string, string> = { userId: user.id, courseId }
      if (batchId) record.batchId = batchId

      const enrollment = await prisma.enrollment.create({
        data: record as unknown as Prisma.EnrollmentCreateInput,
        include: { course: { select: { title: true } } },
      })
      return res.status(200).json(enrollment)
    } catch (e) {
      console.error('Pages API enrollments POST error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'GET') {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: { select: { id: true, title: true, description: true, thumbnail: true, isPublished: true, creator: { select: { name: true } }, _count: { select: { sessions: true } } } },
          batch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(enrollments)
    } catch (e) {
      console.error('Pages API enrollments GET error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
