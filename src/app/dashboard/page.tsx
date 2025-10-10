'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { BookOpen, Users, PlayCircle, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalCourses: number
  enrolledCourses: number
  completedSessions: number
  totalStudents?: number
  totalBatches?: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedSessions: 0,
    totalStudents: 0,
    totalBatches: 0
  })

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">Please log in to access your dashboard.</p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? 'Manage your learning platform' : 'Track your learning progress'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? 'Total Courses' : 'Enrolled Courses'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {isAdmin ? stats.totalCourses : stats.enrolledCourses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <PlayCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Batches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {isAdmin ? (
                  <>
                    <Link
                      href="/courses/new"
                      className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-blue-900 font-medium">Create New Course</span>
                    </Link>
                    <Link
                      href="/batches/new"
                      className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Users className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-green-900 font-medium">Create New Batch</span>
                    </Link>
                    <Link
                      href="/students"
                      className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Users className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-purple-900 font-medium">Manage Students</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/courses"
                      className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-blue-900 font-medium">Browse Courses</span>
                    </Link>
                    <Link
                      href="/progress"
                      className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-green-900 font-medium">View Progress</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Welcome to the platform!</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Your account has been created successfully</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
