import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  const user = await verifyToken(token).catch(() => null)
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  if (req.method === 'GET') {
    try {
      const { batchId } = req.query
      if (typeof batchId === 'string' && batchId.length > 0) {
        const sessions = await prisma.session.findMany({
          where: { batchId },
          orderBy: { order: 'asc' },
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
          },
        })
        return res.status(200).json(sessions)
      }

      // Otherwise, return sessions from user's enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          batch: {
            include: {
              sessions: {
                orderBy: { order: 'asc' },
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
                },
              },
            },
          },
        },
      })

      const sessions = enrollments.flatMap((enrollment) => {
        const batchSessions = (enrollment.batch?.sessions ?? []) as unknown as Array<Record<string, unknown>>
        return batchSessions.map((s) => ({
          ...(s as Record<string, unknown>),
          batchName: enrollment.batch?.name ?? null,
          courseId: enrollment.courseId,
        }))
      })

      return res.status(200).json(sessions)
    } catch (e) {
      console.error('Pages API /api/sessions GET error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
        return res.status(403).json({ error: 'Unauthorized' })
      }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { title, videoUrl, batchId, order, sectionId, startTime, endTime } = body || {}

      if (!title || !videoUrl || !batchId) {
        return res.status(400).json({ error: 'Title, video URL, and batch ID are required' })
      }

      const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { course: true } })
      if (!batch) return res.status(404).json({ error: 'Batch not found' })

      // Validate optional sectionId belongs to batch
      let validSectionId: string | null = null
      if (sectionId) {
        const section = await prisma.courseSection.findUnique({ where: { id: sectionId }, select: { id: true, batchId: true } })
        if (!section) return res.status(404).json({ error: 'Section not found' })
        if (section.batchId !== batchId) return res.status(400).json({ error: 'Section does not belong to batch' })
        validSectionId = section.id
      }

      let parsedOrder = typeof order === 'number' ? order : order ? parseInt(String(order)) : NaN
      if (Number.isNaN(parsedOrder)) {
        const last = await prisma.session.findFirst({ where: { batchId }, orderBy: { order: 'desc' }, select: { order: true } })
        parsedOrder = (last?.order ?? 0) + 1
      }

      const session = await prisma.session.create({
        data: {
          title,
          videoUrl,
          order: parsedOrder,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          courseId: batch.courseId,
          batchId,
          sectionId: validSectionId,
        },
      })

      return res.status(200).json(session)
    } catch (e) {
      console.error('Pages API /api/sessions POST error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    // Bulk / reorder updates not currently supported here
    return res.status(400).json({ error: 'Use /api/sessions/{id} for updates' })
  }

  if (req.method === 'DELETE') {
    return res.status(400).json({ error: 'Use /api/sessions/{id} for deletion' })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
