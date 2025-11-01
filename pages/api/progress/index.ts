import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies['auth-token'] || extractBearer(req.headers.authorization)
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    if (req.method === 'GET') {
      const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined
      if (sessionId) {
        const progress = await prisma.progress.findFirst({
          where: { userId: user.id, sessionId },
          include: {
            session: {
              select: {
                title: true,
                course: { select: { id: true, title: true, thumbnail: true } },
              },
            },
          },
        })
        return res.status(200).json(progress)
      }

      const progress = await prisma.progress.findMany({
        where: { userId: user.id },
        include: {
          session: {
            select: {
              title: true,
              course: { select: { id: true, title: true, thumbnail: true } },
            },
          },
        },
      })
      return res.status(200).json(progress)
    }

    if (req.method === 'POST') {
      const { sessionId, completed } = req.body || {}
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' })
      }

      const existing = await prisma.progress.findFirst({
        where: { userId: user.id, sessionId },
      })

      let saved
      if (existing) {
        saved = await prisma.progress.update({
          where: { id: existing.id },
          data: { completed: !!completed, updatedAt: new Date() },
        })
      } else {
        saved = await prisma.progress.create({
          data: { userId: user.id, sessionId, completed: !!completed },
        })
      }

      return res.status(200).json(saved)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Progress API error (pages api):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function extractBearer(authorization?: string) {
  if (!authorization) return undefined
  if (authorization.startsWith('Bearer ')) return authorization.split(' ')[1]
  return undefined
}
