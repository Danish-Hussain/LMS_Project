import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  const user = token ? await verifyToken(token).catch(() => null) : null

  // Only admins/instructors can modify recorded sessions
  if (req.method === 'PATCH' || req.method === 'DELETE') {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
  }

  const { sessionId } = req.query
  if (typeof sessionId !== 'string') return res.status(400).json({ error: 'Invalid session id' })

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const data: any = {}
      if (typeof body?.isPreview === 'boolean') data.isPreview = body.isPreview
      if (typeof body?.isPublished === 'boolean') data.isPublished = body.isPublished
      if (typeof body?.title === 'string') data.title = body.title
      if (typeof body?.videoUrl === 'string') data.videoUrl = body.videoUrl
      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No fields to update' })

      const updated = await prisma.session.update({ where: { id: sessionId }, data })
      return res.status(200).json(updated)
    } catch (e) {
      console.error('Pages API recorded-courses/[id]/sections/[sectionId]/sessions/[sessionId] PATCH error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.session.delete({ where: { id: sessionId } })
      return res.status(200).json({ success: true })
    } catch (e) {
      console.error('Pages API recorded-courses/[id]/sections/[sectionId]/sessions/[sessionId] DELETE error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
