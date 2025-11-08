import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  const user = await verifyToken(token).catch(() => null)
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    try {
      const session = await prisma.session.findUnique({
        where: { id },
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
      if (!session) return res.status(404).json({ error: 'Session not found' })
      return res.status(200).json(session)
    } catch (e) {
      console.error('Pages API /api/sessions/[id] GET error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const existing = await prisma.session.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Session not found' })

      // Swap-based reorder within scope when order provided
      const wantsOrderChange = typeof body?.order !== 'undefined'
      const baseUpdate: Record<string, unknown> = {}
      if (typeof body?.title !== 'undefined') baseUpdate.title = body.title
      if (typeof body?.videoUrl !== 'undefined') baseUpdate.videoUrl = body.videoUrl
      if (typeof body?.isPublished !== 'undefined') baseUpdate.isPublished = body.isPublished

      let updated
      if (wantsOrderChange) {
        const requestedOrderRaw = parseInt(String(body.order))
        if (!Number.isFinite(requestedOrderRaw)) return res.status(400).json({ error: 'Invalid order value' })

        const scopeWhere: Record<string, unknown> = existing.sectionId ? { sectionId: existing.sectionId } : { batchId: existing.batchId }
        const scoped = await prisma.session.findMany({ where: scopeWhere, orderBy: { order: 'asc' }, select: { id: true, order: true } })
        const maxPos = scoped.length
        let targetOrder = requestedOrderRaw
        if (targetOrder < 1) targetOrder = 1
        if (targetOrder > maxPos) targetOrder = maxPos

        if (targetOrder !== existing.order) {
          const occupying = scoped.find((s) => s.order === targetOrder)
          if (occupying) {
            await prisma.$transaction([
              prisma.session.update({ where: { id: occupying.id }, data: { order: existing.order } }),
              prisma.session.update({ where: { id }, data: { order: targetOrder, ...baseUpdate } }),
            ])
          } else {
            await prisma.session.update({ where: { id }, data: { order: targetOrder, ...baseUpdate } })
          }
          updated = await prisma.session.findUnique({ where: { id } })
        } else {
          updated = Object.keys(baseUpdate).length ? await prisma.session.update({ where: { id }, data: baseUpdate }) : existing
        }
      } else {
        updated = Object.keys(baseUpdate).length ? await prisma.session.update({ where: { id }, data: baseUpdate }) : existing
      }

      return res.status(200).json(updated)
    } catch (e) {
      console.error('Pages API /api/sessions/[id] PUT error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    try {
      const existing = await prisma.session.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Session not found' })
      await prisma.session.delete({ where: { id } })
      return res.status(200).json({ message: 'Session deleted successfully' })
    } catch (e) {
      console.error('Pages API /api/sessions/[id] DELETE error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, PATCH, DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
