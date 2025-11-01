import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  let user: any
  try { user = await verifyToken(token) } catch { return res.status(401).json({ error: 'Invalid token' }) }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) return res.status(403).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    try {
      const batches = await prisma.batch.findMany({
        include: { _count: { select: { students: true, enrollments: true } } },
        orderBy: { createdAt: 'desc' }
      })
      return res.status(200).json(batches)
    } catch (error) {
      console.error('Pages API batches GET error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, startDate, endDate, courseId } = req.body || {}
      if (!name || !startDate || !courseId) return res.status(400).json({ error: 'Name, start date, and course are required' })

      const batch = await prisma.batch.create({
        data: {
          name,
          description,
          startDate: new Date(startDate),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          course: { connect: { id: courseId } },
        },
        include: { _count: { select: { students: true, enrollments: true } } }
      })

      return res.status(201).json(batch)
    } catch (error) {
      console.error('Pages API batches POST error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
