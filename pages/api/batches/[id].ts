import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  let user: any
  try { user = await verifyToken(token) } catch { return res.status(401).json({ error: 'Invalid token' }) }

  if (req.method === 'GET') {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
          course: { select: { id: true, title: true, description: true, price: true } },
          sections: { select: { id: true, title: true, description: true, order: true }, orderBy: { order: 'asc' } },
          sessions: { orderBy: { order: 'asc' }, select: { id: true, title: true, videoUrl: true, order: true, startTime: true, endTime: true, courseId: true, batchId: true, sectionId: true, isPublished: true, createdAt: true, updatedAt: true } },
          _count: { select: { students: true, enrollments: true } },
        },
      })
      if (!batch) return res.status(404).json({ error: 'Batch not found' })
      return res.status(200).json(batch)
    } catch (error) {
      console.error('Pages API batches/:id GET error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) return res.status(403).json({ error: 'Unauthorized' })
    try {
      const { name, description, startDate, endDate, isActive } = req.body || {}
      const batch = await prisma.batch.findUnique({ where: { id } })
      if (!batch) return res.status(404).json({ error: 'Batch not found' })
      const updated = await prisma.batch.update({
        where: { id },
        data: {
          name,
          description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          isActive,
        },
        include: {
          course: { select: { id: true, title: true, price: true } },
          sessions: { select: { id: true, title: true, videoUrl: true, order: true, startTime: true, endTime: true, courseId: true, batchId: true, sectionId: true, isPublished: true, createdAt: true, updatedAt: true } },
          _count: { select: { students: true, enrollments: true } },
        }
      })
      return res.status(200).json(updated)
    } catch (error) {
      console.error('Pages API batches/:id PUT error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) return res.status(403).json({ error: 'Unauthorized' })
    try {
      const batch = await prisma.batch.findUnique({ where: { id } })
      if (!batch) return res.status(404).json({ error: 'Batch not found' })
      await prisma.batch.delete({ where: { id } })
      return res.status(200).json({ message: 'Batch deleted successfully' })
    } catch (error) {
      console.error('Pages API batches/:id DELETE error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
