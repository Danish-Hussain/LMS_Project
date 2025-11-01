import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const token = req.cookies['auth-token'] || null
      const user = token ? await verifyToken(token) : null
      const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR'))

      const { courseId, published } = req.query
      const where: any = {}
      if (courseId && typeof courseId === 'string') where.courseId = courseId
      if (!isAdmin) {
        where.isPublished = true
      } else if (published === 'true') {
        where.isPublished = true
      }

      let recordedCourses: any[]
      try {
        recordedCourses = await prisma.recordedCourse.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isPublished: true,
            createdAt: true,
            courseId: true,
            discountPercent: true,
            course: {
              select: { id: true, title: true, thumbnail: true },
            },
          } as any,
        })
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : ''
        const unknownField = msg.includes('Unknown field `discountPercent`')
        if (!unknownField) throw e
        // Retry without discountPercent and fetch via raw SQL
        const base = await prisma.recordedCourse.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isPublished: true,
            createdAt: true,
            courseId: true,
            course: { select: { id: true, title: true, thumbnail: true } },
          } as any,
        })
        const ids = base.map((c: any) => c.id)
        let dmap = new Map<string, number>()
        if (ids.length) {
          try {
            const rows = await prisma.$queryRaw<Array<{ id: string; discountPercent: number | null }>>`
              SELECT id, discountPercent FROM recorded_courses
              WHERE id IN (${Prisma.join(ids)})
            `
            dmap = new Map(rows.map(r => [r.id, typeof r.discountPercent === 'number' ? r.discountPercent : 0]))
          } catch (rawErr) {
            console.warn('Failed to fetch recorded discountPercent via raw SQL:', rawErr)
          }
        }
        recordedCourses = base.map((c: any) => ({ ...c, discountPercent: dmap.get(c.id) ?? 0 }))
      }

      return res.status(200).json(recordedCourses)
    } catch (error) {
      console.error('Pages API recorded-courses GET error:', error)
      return res.status(500).json({ error: 'Failed to fetch recorded courses' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { courseId, courseName, description, price, discountPercent } = req.body || {}
      if (!courseId) return res.status(400).json({ error: 'Course ID is required' })

      let finalName: string = (courseName && String(courseName).trim()) || ''
      if (!finalName) {
        try {
          const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } })
          if (course?.title) finalName = `${course.title} — On‑demand`
        } catch {}
        if (!finalName) finalName = 'Self‑paced Course'
      }

      const normalizedPrice = (price !== undefined && price !== null && String(price) !== '')
        ? Math.max(0, Math.round(Number(price) * 100) / 100)
        : 0

      let normalizedDiscount: number | undefined = undefined
      if (discountPercent !== undefined && discountPercent !== null && String(discountPercent) !== '') {
        const dp = Number(discountPercent)
        if (Number.isNaN(dp)) return res.status(400).json({ error: 'Discount must be a valid number' })
        if (dp < 0 || dp > 100) return res.status(400).json({ error: 'Discount must be between 0 and 100' })
        normalizedDiscount = Math.round(dp * 100) / 100
      }

      let recordedCourse: any
      try {
        recordedCourse = await prisma.recordedCourse.create({
          data: {
            courseId,
            name: finalName,
            description: (description ?? null) as string | null,
            price: normalizedPrice,
            isPublished: true,
            ...(normalizedDiscount !== undefined ? { discountPercent: normalizedDiscount } : {}),
          },
        })
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : ''
        const unknownArg = msg.includes('Unknown argument `discountPercent`')
        if (!unknownArg) throw e
        recordedCourse = await prisma.recordedCourse.create({
          data: {
            courseId,
            name: finalName,
            description: (description ?? null) as string | null,
            price: normalizedPrice,
            isPublished: true,
          },
        })
        if (normalizedDiscount !== undefined) {
          try {
            await prisma.$executeRaw`UPDATE recorded_courses SET discountPercent = ${normalizedDiscount} WHERE id = ${recordedCourse.id}`
            ;(recordedCourse as any).discountPercent = normalizedDiscount
          } catch (rawErr) {
            console.warn('Failed to set recorded discount via raw SQL:', rawErr)
          }
        }
      }

      return res.status(201).json({ success: true, data: recordedCourse, id: recordedCourse.id })
    } catch (error) {
      console.error('Pages API recorded-courses POST error:', error)
      return res.status(500).json({ error: 'Failed to create recorded course' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
