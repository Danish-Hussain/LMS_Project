import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  // GET: list sections for a batch (with sessions)
  if (req.method === 'GET') {
    try {
      const token = req.cookies['auth-token']
      if (!token) return res.status(401).json({ error: 'Not authenticated' })
      const user = await verifyToken(token).catch(() => null)
      if (!user) return res.status(401).json({ error: 'Invalid token' })

      const sections = await prisma.courseSection.findMany({
        where: { batchId: id },
        include: { sessions: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      })
      return res.status(200).json(sections)
    } catch (e) {
      console.error('Pages API batches/:id/sections GET error:', e)
      return res.status(500).json({ error: 'Failed to fetch sections' })
    }
  }

  // POST: create a new section in a batch
  if (req.method === 'POST') {
    try {
      const token = req.cookies['auth-token']
      if (!token) return res.status(401).json({ error: 'Not authenticated' })
      const user = await verifyToken(token).catch(() => null)
      if (!user) return res.status(401).json({ error: 'Invalid token' })
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { title, description, courseId } = body || {}

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' })
      }
      if (!courseId || typeof courseId !== 'string') {
        return res.status(400).json({ error: 'Course ID is required' })
      }

      // Verify batch belongs to course
      const batch = await prisma.batch.findFirst({ where: { id, courseId } })
      if (!batch) {
        return res.status(404).json({ error: 'Invalid batch or course ID' })
      }

      // Determine order
      const lastSection = await prisma.courseSection.findFirst({
        where: { batchId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      const nextOrder = (lastSection?.order ?? 0) + 1

      const section = await prisma.courseSection.create({
        data: {
          title,
          description,
          batchId: id,
          courseId,
          order: nextOrder,
        },
        include: { sessions: true },
      })

      return res.status(200).json(section)
    } catch (e) {
      console.error('Pages API batches/:id/sections POST error:', e)
      return res.status(500).json({ error: 'Failed to create section' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
