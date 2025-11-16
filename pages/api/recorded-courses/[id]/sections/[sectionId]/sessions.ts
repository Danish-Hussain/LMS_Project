import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, sectionId } = req.query
  if (typeof id !== 'string' || typeof sectionId !== 'string') {
    return res.status(400).json({ error: 'Invalid course or section id' })
  }

  if (req.method === 'POST') {
    try {
      const { title, videoUrl, order, isPreview } = req.body || {}
      if (!title || !videoUrl) {
        return res.status(400).json({ error: 'Title and videoUrl are required' })
      }

      // Ensure section belongs to this course (courseId param maps to underlying course id, not recordedCourseId)
      const section = await prisma.courseSection.findFirst({ where: { id: sectionId, courseId: id } })
      if (!section) return res.status(404).json({ error: 'Section not found for course' })

      // Determine next order if not provided
      let nextOrder = order
      if (typeof nextOrder !== 'number') {
        const last = await prisma.session.findFirst({ where: { sectionId }, orderBy: { order: 'desc' }, select: { order: true } })
        nextOrder = (last?.order ?? 0) + 1
      }

      const session = await prisma.session.create({
        data: {
          title,
          videoUrl,
          order: nextOrder,
          courseId: id,
          sectionId,
          ...(typeof isPreview === 'boolean' ? { isPreview } : {})
        }
      })
      return res.status(201).json(session)
    } catch (e) {
      console.error('Pages API recorded-courses/:id/sections/:sectionId/sessions POST error:', e)
      return res.status(500).json({ error: 'Failed to create session' })
    }
  }

  res.setHeader('Allow', 'POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
