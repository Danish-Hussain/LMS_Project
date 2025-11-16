import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token']
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const user = await verifyToken(token).catch(() => null)
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' })

  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    try {
      const row = await prisma.user.findUnique({ where: { id } })
      if (!row) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(row)
    } catch (e) {
      console.error('Pages API GET /api/instructors/[id] error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { name, email, roles, password } = body || {}

      let canCreateBlogs: boolean | undefined
      let canCreateCourses: boolean | undefined
      if (Array.isArray(roles)) {
        canCreateBlogs = roles.includes('BLOGS')
        canCreateCourses = roles.includes('COURSES')
      } else if (roles && typeof roles === 'object') {
        if (typeof roles.blogs !== 'undefined') canCreateBlogs = !!roles.blogs
        if (typeof roles.courses !== 'undefined') canCreateCourses = !!roles.courses
      }

      const data: any = {}
      if (typeof name !== 'undefined') data.name = name
      if (typeof email !== 'undefined') data.email = email
      if (typeof canCreateBlogs !== 'undefined') data.canCreateBlogs = canCreateBlogs
      if (typeof canCreateCourses !== 'undefined') data.canCreateCourses = canCreateCourses
      if (typeof password === 'string' && password.length >= 6) {
        data.password = await hashPassword(password)
      }

      const updated = await prisma.user.update({ where: { id }, data })
      return res.status(200).json(updated)
    } catch (e: any) {
      console.error('Pages API PUT /api/instructors/[id] error:', e)
      if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.user.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (e) {
      console.error('Pages API DELETE /api/instructors/[id] error:', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
