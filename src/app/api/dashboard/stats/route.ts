import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'

    if (isAdmin) {
      // Admin/Instructor stats
      const [
        totalCourses,
        totalStudents,
        totalBatches,
        totalSessions
      ] = await Promise.all([
        prisma.course.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.batch.count({ where: { isActive: true } }),
        prisma.session.count()
      ])

      return NextResponse.json({
        totalCourses,
        totalStudents,
        totalBatches,
        totalSessions
      })
    } else {
      // Student stats
      const [
        enrolledCourses,
        completedSessions,
        totalSessions
      ] = await Promise.all([
        prisma.enrollment.count({
          where: { userId: user.id }
        }),
        prisma.progress.count({
          where: { 
            userId: user.id,
            completed: true
          }
        }),
        prisma.progress.count({
          where: { userId: user.id }
        })
      ])

      return NextResponse.json({
        enrolledCourses,
        completedSessions,
        totalSessions
      })
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
