import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken, createUser, hashPassword } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const user = await verifyToken(token).catch(() => null)
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    try {
      const instructors = await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        orderBy: { createdAt: 'desc' }
      }) as any
      return res.status(200).json(instructors)
    } catch (e) {
      console.error('Pages API GET /api/instructors error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { name, email, password, roles } = body || {}
      if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' })
      if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

      let canCreateBlogs = false
      let canCreateCourses = false
      if (Array.isArray(roles)) {
        canCreateBlogs = roles.includes('BLOGS')
        canCreateCourses = roles.includes('COURSES')
      } else if (roles && typeof roles === 'object') {
        canCreateBlogs = !!roles.blogs
        canCreateCourses = !!roles.courses
      }

      const created = await createUser(email, password, name, 'INSTRUCTOR')
      await prisma.user.update({ where: { id: created.id }, data: { canCreateBlogs, canCreateCourses } as any })
      return res.status(200).json({ id: created.id, email: created.email, name: created.name, role: created.role, canCreateBlogs, canCreateCourses })
    } catch (e: any) {
      console.error('Pages API POST /api/instructors error:', e)
      if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
