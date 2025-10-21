'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Play, Users, Clock } from 'lucide-react'
import CourseThumbnail from '@/components/CourseThumbnail'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  isPublished: boolean
  createdAt: string
  creator: {
    name: string
  }
  sessions: {
    id: string
    title: string
    duration: number | null
  }[]
  _count: {
    enrollments: number
  }
}

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Allow guests to browse published courses as well
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Guests can browse courses without logging in

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR'

  return (
  <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Courses</h1>
            <p className="mt-2" style={{ color: 'var(--session-subtext)' }}>
              {isAdmin ? 'Manage your courses' : 'Browse available courses'}
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/courses/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Course
            </Link>
          )}
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No courses found</h3>
            <p style={{ color: 'var(--session-subtext)' }}>
              {isAdmin ? 'Create your first course to get started.' : 'No courses are available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" style={{ background: 'var(--background)', border: '1px solid var(--section-border)' }}>
                <CourseThumbnail
                  thumbnail={course.thumbnail}
                  title={course.title}
                />
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold line-clamp-2" style={{ color: 'var(--foreground)' }}>
                      {course.title}
                    </h3>
                    {!course.isPublished && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--session-subtext)' }}>
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center text-sm mb-4" style={{ color: 'var(--session-subtext)' }}>
                    <Users className="h-4 w-4 mr-1" />
                    <span>{course._count.enrollments} enrolled</span>
                    <Clock className="h-4 w-4 ml-4 mr-1" />
                    <span>{course.sessions.length} sessions</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--session-subtext)' }}>
                      by {course.creator.name}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {isAdmin ? 'Manage' : 'View'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
