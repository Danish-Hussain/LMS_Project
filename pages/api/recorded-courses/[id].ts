import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    try {
      const token = req.cookies['auth-token'] || null
      const user = token ? await verifyToken(token) : null
      const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))

      const recordedCourse = await prisma.recordedCourse.findUnique({
        where: { id },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, description: true, creator: { select: { name: true } } },
          },
        },
      })
      if (!recordedCourse) return res.status(404).json({ error: 'Course not found' })
      if (!recordedCourse.isPublished && !isAdmin) return res.status(404).json({ error: 'Course not found' })
      return res.status(200).json(recordedCourse)
    } catch (error) {
      console.error('Pages API recorded-courses/:id GET error:', error)
      return res.status(500).json({ error: 'Failed to fetch recorded course' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, price, isPublished, discountPercent } = req.body || {}
      const updated = await prisma.recordedCourse.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(discountPercent !== undefined && { discountPercent: Math.max(0, Math.min(100, Number(discountPercent))) }),
          ...(isPublished !== undefined && { isPublished }),
        },
      })
      return res.status(200).json(updated)
    } catch (error) {
      console.error('Pages API recorded-courses/:id PUT error:', error)
      return res.status(500).json({ error: 'Failed to update recorded course' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rc = await prisma.recordedCourse.findUnique({ where: { id }, select: { courseId: true } })
      if (!rc) return res.status(404).json({ error: 'Course not found' })

      const siblings = await prisma.recordedCourse.count({ where: { courseId: rc.courseId, NOT: { id } } })

      await prisma.$transaction(async (tx) => {
        if (siblings === 0) {
          const sections = await tx.courseSection.findMany({ where: { courseId: rc.courseId, batchId: null }, select: { id: true } })
          const sectionIds = sections.map((s) => s.id)
          if (sectionIds.length > 0) {
            await tx.session.deleteMany({ where: { sectionId: { in: sectionIds } } })
            await tx.courseSection.deleteMany({ where: { id: { in: sectionIds } } })
          }
        }
        await tx.recordedCourse.delete({ where: { id } })
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Pages API recorded-courses/:id DELETE error:', error)
      return res.status(500).json({ error: 'Failed to delete recorded course' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
