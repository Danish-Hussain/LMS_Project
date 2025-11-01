import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const token = req.cookies['auth-token']
      let user: any = null
      if (token) {
        try { user = await verifyToken(token) } catch { user = null }
      }
      const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))

      let where: any = { isPublished: true }
      if (user) {
        if (user.role === 'ADMIN') where = {}
        else if (user.role === 'INSTRUCTOR') where = { creatorId: user.id }
      }

      const baseSelect: any = {
        id: true, title: true, description: true, thumbnail: true, price: true, isPublished: true, creatorId: true,
        creator: { select: { name: true } },
        sessions: { select: { id: true, title: true, startTime: true, endTime: true, isPublished: true } },
        recordedCourses: { select: { id: true, price: true, discountPercent: true, isPublished: true } },
        _count: { select: { enrollments: true } },
      }
      const selectWithDiscount: any = { ...baseSelect, discountPercent: true }

      let courses: any[]
      try {
        courses = await prisma.course.findMany({ where, select: selectWithDiscount, orderBy: { createdAt: 'desc' } })
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : ''
        if (!msg.includes('Unknown field `discountPercent`')) throw e
        const result = await prisma.course.findMany({ where, select: baseSelect, orderBy: { createdAt: 'desc' } })
        const ids = result.map((c: any) => c.id)
        let dmap = new Map<string, number>()
        if (ids.length) {
          try {
            const rows = await prisma.$queryRaw<Array<{ id: string; discountPercent: number }>>`
              SELECT id, discountPercent FROM courses WHERE id IN (${Prisma.join(ids)})
            `
            dmap = new Map(rows.map(r => [r.id, typeof r.discountPercent === 'number' ? r.discountPercent : 0]))
          } catch (rawErr) {
            console.warn('Failed to fetch discount via raw SQL:', rawErr)
          }
        }
        courses = result.map((c: any) => ({ ...c, discountPercent: dmap.get(c.id) ?? 0 }))
      }

      return res.status(200).json(courses)
    } catch (error: any) {
      console.error('Pages API courses GET error:', error)
      return res.status(500).json({ error: error?.message || 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const token = req.cookies['auth-token']
      if (!token) return res.status(401).json({ error: 'Not authenticated' })

      let user: any
      try { user = await verifyToken(token) } catch { return res.status(401).json({ error: 'Session expired. Please log in again' }) }
      if (!user || !user.id) return res.status(401).json({ error: 'Invalid user session' })

      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, role: true } })
      if (!dbUser) return res.status(404).json({ error: 'User account not found' })
      if (dbUser.role !== 'ADMIN' && dbUser.role !== 'INSTRUCTOR') return res.status(403).json({ error: 'Only admins and instructors can create courses' })

      const body = req.body || {}
      const { title, description, thumbnail, price, isPublished = true, discountPercent } = body
      if (!title || typeof title !== 'string' || title.trim().length === 0) return res.status(400).json({ error: 'Title is required' })
      if (title.trim().length > 255) return res.status(400).json({ error: 'Title cannot exceed 255 characters' })

      if (description !== undefined && description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string' })
      if (thumbnail !== undefined && thumbnail !== null && typeof thumbnail !== 'string') return res.status(400).json({ error: 'Thumbnail must be a URL string' })

      let validatedPrice: number | null = null
      if (price !== undefined && price !== null && price !== '') {
        const numPrice = Number(price)
        if (isNaN(numPrice)) return res.status(400).json({ error: 'Price must be a valid number' })
        if (numPrice < 0) return res.status(400).json({ error: 'Price cannot be negative' })
        validatedPrice = Math.round(numPrice * 100) / 100
      }

      let validatedDiscount: number | undefined = undefined
      if (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') {
        const dp = Number(discountPercent)
        if (isNaN(dp)) return res.status(400).json({ error: 'Discount must be a valid number' })
        if (dp < 0 || dp > 100) return res.status(400).json({ error: 'Discount must be between 0 and 100' })
        validatedDiscount = Math.round(dp * 100) / 100
      }

      const courseData: any = {
        title: title.trim(),
        description: (typeof description === 'string' && description.trim()) ? description.trim() : null,
        thumbnail: (typeof thumbnail === 'string' && thumbnail.trim()) ? thumbnail.trim() : null,
        price: validatedPrice,
        isPublished: Boolean(isPublished),
        ...(validatedDiscount !== undefined ? { discountPercent: validatedDiscount } : {}),
        creatorId: user.id,
      }

      let course: any
      try {
        course = await prisma.course.create({ data: courseData, include: { creator: { select: { name: true, email: true } }, sessions: true, _count: { select: { enrollments: true, sessions: true } } } })
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : ''
        if (!msg.includes('Unknown argument `discountPercent`')) throw e
        const { discountPercent: _dp, ...fallbackData } = courseData
        course = await prisma.course.create({ data: fallbackData, include: { creator: { select: { name: true, email: true } }, sessions: true, _count: { select: { enrollments: true, sessions: true } } } })
        if (validatedDiscount !== undefined) {
          try {
            await prisma.$executeRaw`UPDATE courses SET discountPercent = ${validatedDiscount} WHERE id = ${course.id}`
            course.discountPercent = validatedDiscount
          } catch (rawErr) {
            console.warn('Failed to set discount via raw SQL:', rawErr)
          }
        }
      }

      res.setHeader('Location', `/courses/${course.id}`)
      return res.status(201).json({ success: true, data: course, id: course.id, message: 'Course created successfully' })
    } catch (error: any) {
      console.error('Pages API courses POST error:', error)
      if (error?.message && error.message.includes('Unique constraint failed')) return res.status(409).json({ error: 'A course with this title already exists' })
      return res.status(500).json({ error: error?.message || 'Failed to create course' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
