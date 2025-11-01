import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ message: 'Not authenticated' })
    const user = await verifyToken(token).catch(() => null) as any
    if (!user) return res.status(401).json({ message: 'Invalid token' })

    const { recordedCourseId } = req.body || {}
    if (!recordedCourseId) return res.status(400).json({ message: 'Recorded course ID is required' })

    const recordedCourse = await prisma.recordedCourse.findUnique({ where: { id: recordedCourseId }, select: { id: true, isPublished: true } })
    if (!recordedCourse) return res.status(404).json({ message: 'Recorded course not found' })
    if (!recordedCourse.isPublished) return res.status(400).json({ message: 'This course is not yet available for enrollment' })

    const existing = await prisma.recordedCourseEnrollment.findUnique({
      where: { userId_recordedCourseId: { userId: user.id, recordedCourseId } },
    })
    if (existing) return res.status(400).json({ message: 'Already enrolled in this course' })

    const enrollment = await prisma.recordedCourseEnrollment.create({ data: { userId: user.id, recordedCourseId, enrolledAt: new Date() } })
    return res.status(201).json(enrollment)
  } catch (error: any) {
    console.error('Pages API recorded-courses/enrollments POST error:', error)
    return res.status(500).json({ message: 'Failed to enroll in course', error: error?.message || 'Unknown error' })
  }
}
