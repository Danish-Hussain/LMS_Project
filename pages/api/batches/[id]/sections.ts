import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

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

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
