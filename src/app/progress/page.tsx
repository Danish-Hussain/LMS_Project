'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, ReactNode } from 'react'
import { Clock, CheckCircle, BookOpen, PlayCircle } from 'lucide-react'
import { ProgressStats } from '@/components/ui/ProgressStats'

interface ProgressIndicator {
  id: string
  icon: ReactNode
  text: string
}

interface CourseProgress {
  courseId: string
  courseTitle: string
  thumbnail: string | null
  totalSessions: number
  completedSessions: number
  lastActivityDate: string | null
}

export default function ProgressPage() {
  const { user, loading } = useAuth()
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  // isLoading covers either initial auth resolution or progress fetch; starts true until auth finishes
  const [isLoading, setIsLoading] = useState(true)

  // When auth finishes: if we have a user fetch progress; otherwise stop loading so sign-in prompt shows
  useEffect(() => {
    if (!loading) {
      if (user) {
        setIsLoading(true)
        fetchProgress()
      } else {
        setIsLoading(false)
      }
    }
  }, [loading, user])

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress')
      if (response.ok) {
        const data = await response.json()
        
        // Group progress by course
        const courseMap = new Map<string, CourseProgress>()
        
        data.forEach((item: any) => {
          const courseId = item.session.course.id
          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              courseId,
              courseTitle: item.session.course.title,
              thumbnail: item.session.course.thumbnail,
              totalSessions: 0,
              completedSessions: 0,
              lastActivityDate: null
            })
          }
          
          const course = courseMap.get(courseId)!
          course.totalSessions++
          if (item.completed) {
            course.completedSessions++
            const completedDate = new Date(item.completedAt || new Date())
            if (!course.lastActivityDate || new Date(course.lastActivityDate) < completedDate) {
              course.lastActivityDate = completedDate.toISOString()
            }
          }
        })
        
        setCourseProgress(Array.from(courseMap.values()))
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0
  }

  const getTotalProgress = () => {
    if (courseProgress.length === 0) return 0
    const totalCompleted = courseProgress.reduce((sum, course) => sum + course.completedSessions, 0)
    const totalSessions = courseProgress.reduce((sum, course) => sum + course.totalSessions, 0)
    return totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0
  }

  const getTotalCompletedSessions = () => {
    return courseProgress.reduce((sum, course) => sum + course.completedSessions, 0)
  }

  const getTotalSessions = () => {
    return courseProgress.reduce((sum, course) => sum + course.totalSessions, 0)
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg mb-6" style={{ color: 'var(--foreground)' }}>Please sign in to view your progress.</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-6 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold transition-colors shadow-sm"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>My Progress</h1>
          <p className="mt-2" style={{ color: 'var(--session-subtext)' }}>Track your learning journey and achievements</p>
        </div>

        {/* Progress Overview */}
        <ProgressStats
          totalProgress={getTotalProgress()}
          completedSessions={getTotalCompletedSessions()}
          totalSessions={getTotalSessions()}
          activeCourses={courseProgress.length}
        />

        {/* Course Progress List */}
        <div className="rounded-lg shadow-md" style={{ background: 'var(--section-bg)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--section-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Course Progress</h3>
          </div>
          
          {courseProgress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--session-subtext)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No progress yet</h3>
              <p style={{ color: 'var(--session-subtext)' }}>Start learning to track your progress here.</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--section-border)' }}>
              {courseProgress.map((course, idx) => (
                <div 
                  key={course.courseId ?? `course-${idx}`} 
                  className="p-6 transition-colors"
                  style={{ 
                    borderBottom: idx < courseProgress.length - 1 ? '1px solid var(--section-border)' : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--section-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium" style={{ color: 'var(--session-text)' }}>
                          {course.courseTitle}
                        </h4>
                        {course.completedSessions === course.totalSessions && course.totalSessions > 0 && (
                          <div className="ml-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm" style={{ color: 'var(--session-subtext)' }}>
                        <div className="flex items-center">
                          <PlayCircle className="h-4 w-4 mr-1" />
                          <span>{course.completedSessions} of {course.totalSessions} sessions completed</span>
                        </div>
                        {course.lastActivityDate && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Last activity: {new Date(course.lastActivityDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-6 flex-shrink-0 flex flex-col items-end gap-2">
                      <div className="w-32 mb-2">
                        <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--session-subtext)' }} role="presentation">
                          <div>Progress</div>
                          <div>
                            {Math.round(getProgressPercentage(course.completedSessions, course.totalSessions))}%
                          </div>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ background: 'var(--section-border)' }}>
                          <div
                            className={`h-2 rounded-full ${
                              course.completedSessions === course.totalSessions 
                                ? 'bg-green-500' 
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${getProgressPercentage(course.completedSessions, course.totalSessions)}%`
                            }}
                            role="progressbar"
                            aria-valuenow={Math.round(getProgressPercentage(course.completedSessions, course.totalSessions))}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                      </div>
                      {course.courseId ? (
                        <a
                          href={`/courses/${course.courseId}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                        >
                          {course.completedSessions === course.totalSessions && course.totalSessions > 0 ? 'Review Course' : 'Continue Course'}
                        </a>
                      ) : (
                        <span className="text-xs text-red-500">Course ID missing</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
