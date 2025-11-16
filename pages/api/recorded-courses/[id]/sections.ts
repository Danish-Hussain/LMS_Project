import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    try {
      const previewOnly = req.query.preview === 'true'
      const sectionsRaw = await prisma.courseSection.findMany({
        where: { courseId: id, batchId: null },
        include: { sessions: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      })

      let sections: any = sectionsRaw
      if (previewOnly) {
        const withPreview = sectionsRaw.map((sec: any) => ({
          ...sec,
          sessions: (sec.sessions || []).filter((s: any) => !!s.isPreview),
        }))
        const hasAny = withPreview.some((s: any) => (s.sessions?.length || 0) > 0)
        sections = hasAny
          ? withPreview
          : sectionsRaw.map((sec: any) => ({ ...sec, sessions: sec.sessions && sec.sessions.length ? [sec.sessions[0]] : [] }))
      }

      return res.status(200).json(sections)
    } catch (e) {
      console.error('Pages API recorded-courses/:id/sections GET error:', e)
      return res.status(500).json({ error: 'Failed to fetch sections' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, order } = req.body || {}
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' })
      }

      const section = await prisma.courseSection.create({
        data: {
          title,
          description,
          order: order || 1,
          courseId: id,
          batchId: null,
        },
        include: { sessions: true }
      })

      return res.status(201).json(section)
    } catch (e) {
      console.error('Pages API recorded-courses/:id/sections POST error:', e)
      return res.status(500).json({ error: 'Failed to create section' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
