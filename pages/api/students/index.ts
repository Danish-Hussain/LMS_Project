import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const token = req.cookies['auth-token']
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        _count: { select: { enrollments: true, progress: true, recordedCourseEnrollments: true } },
        batches: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json(students)
  } catch (error) {
    console.error('Students fetch error (pages api):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
