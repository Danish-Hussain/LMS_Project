 'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { BookOpen, Users, PlayCircle, Award, TrendingUp, Quote } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// Brand logo + wordmark will be inlined in the header
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Typewriter from '@/components/Typewriter'
import dynamic from 'next/dynamic'

const BannerCarousel = dynamic(() => import('@/components/BannerCarousel'), { ssr: false })

interface DashboardStats {
  totalCourses: number
  enrolledCourses: number
  completedSessions: number
  totalStudents?: number
  totalBatches?: number
}

export default function DashboardContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedSessions: 0,
    totalStudents: 0,
    totalBatches: 0
  })
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Guests can view a public dashboard (no access block)
  const isAdminOnly = user?.role === 'ADMIN'
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isAdminOrInstructor = isAdminOnly || isInstructor
  const isGuest = !user

  return (
  <div className="pb-10" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
  <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {user ? `Welcome back, ${user.name}!` : 'Welcome'}
          </h1>
          <p className="mt-2" style={{ color: 'var(--session-subtext)' }}>
            {user ? (isAdminOrInstructor ? 'Manage your learning platform' : 'Track your learning progress') : 'Explore our mission, browse courses, and get started.'}
          </p>
        </div>

        


  {/* Our Mission left (50%) and right column (50%) */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch lg:min-h-[320px]">
          {/* Left: Our Mission spanning both rows */}
  <div className="rounded-lg shadow h-full lg:order-2 min-h-[260px]" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
            <div className="p-5 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Our Mission
              </h2>
              <div className="text-[15px] leading-7 flex-1">
                <div
                  className="relative rounded-2xl border p-5 md:p-6 h-full flex items-center overflow-hidden ring-1 ring-inset ring-blue-600/10 dark:ring-white/10 transition-colors transition-shadow hover:ring-blue-500/40"
                  style={{ background: 'var(--background)', borderColor: 'var(--section-border)', color: 'var(--foreground)' }}
                >
                  <Quote className="absolute top-3 left-3 h-5 w-5 text-blue-600/20 dark:text-blue-400/40 pointer-events-none select-none" aria-hidden="true" />
                  {/* Decorative glows removed to avoid light/cream tint in dark mode */}
                  <Typewriter
                    className="font-medium text-center mx-auto max-w-3xl text-[16px] md:text-[17px] leading-8"
                    messages={[
                      '“The purpose of this platform is to make SAP Integration learning accessible to everyone. Empowering learners to master SAP CPI with all other BTP IS capabilities through guided, hands-on training.”',
                    ]}
                    typingSpeed={22}
                    pauseBetween={1600}
                    loop={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Top - Stats; Bottom - Quick Actions */}
          <div className="flex flex-col h-full lg:order-1 min-h-[260px]">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 mb-6 flex-1">
              <div className="rounded-lg shadow p-6" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
                <div className="flex items-center">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--session-subtext)' }}>
                      {isAdminOrInstructor ? 'Total Courses' : 'Enrolled Courses'}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                      {isAdminOrInstructor ? stats.totalCourses : stats.enrolledCourses}
                    </p>
                  </div>
                </div>
              </div>

              {!isInstructor && (
                <div className="rounded-lg shadow p-6" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                      <PlayCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--session-subtext)' }}>Completed Sessions</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.completedSessions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Students should only be visible to ADMINs. Active Batches shown to Admins and Instructors */}
              {isAdminOnly && (
                <div className="rounded-lg shadow p-6" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--session-subtext)' }}>Total Students</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.totalStudents}</p>
                    </div>
                  </div>
                </div>
              )}

              {isAdminOrInstructor && (
                <div className="rounded-lg shadow p-6" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--session-subtext)' }}>Active Batches</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.totalBatches}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg shadow mt-auto" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  {isAdminOrInstructor ? (
                    <>
                      <Link
                        href="/courses/new"
                        className="flex items-center p-3 rounded-lg transition-colors"
                        style={{ background: 'rgba(37, 99, 235, 0.08)' }}
                      >
                        <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Create New Course</span>
                      </Link>
                      <Link
                        href="/batches/new"
                        className="flex items-center p-3 rounded-lg transition-colors"
                        style={{ background: 'rgba(16,185,129,0.08)' }}
                      >
                        <Users className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Create New Batch</span>
                      </Link>
                      {isAdminOnly && (
                        <Link
                          href="/students"
                          className="flex items-center p-3 rounded-lg transition-colors"
                          style={{ background: 'rgba(168, 85, 247, 0.08)' }}
                        >
                          <Users className="h-5 w-5 text-purple-600 mr-3" />
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>Manage Students</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/courses"
                        className="flex items-center p-3 rounded-lg transition-colors"
                        style={{ background: 'rgba(37, 99, 235, 0.08)' }}
                      >
                        <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Browse Courses</span>
                      </Link>
                      {isGuest ? (
                        <button
                          onClick={() => setLoginPromptOpen(true)}
                          className="w-full flex items-center p-3 rounded-lg transition-colors cursor-pointer"
                          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
                        >
                          <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>View Progress</span>
                        </button>
                      ) : (
                        <Link
                          href="/progress"
                          className="flex items-center p-3 rounded-lg transition-colors"
                          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
                        >
                          <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>View Progress</span>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="mt-6 mb-2">
          <BannerCarousel />
        </div>
        {/* Login prompt for guests clicking View Progress */}
        <ConfirmDialog
          open={loginPromptOpen}
          title="Sign in required"
          message="Please sign in to view your learning progress."
          cancelLabel="Cancel"
          confirmLabel="Login"
          onCancel={() => setLoginPromptOpen(false)}
          onConfirm={() => {
            setLoginPromptOpen(false)
            router.push('/login')
          }}
        />
      </div>
    </div>
  )
}
