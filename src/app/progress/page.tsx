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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProgress()
    }
  }, [user])

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
          <p className="text-gray-600 mb-8">Please log in to view your progress.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-2">Track your learning journey and achievements</p>
        </div>

        {/* Progress Overview */}
        <ProgressStats
          totalProgress={getTotalProgress()}
          completedSessions={getTotalCompletedSessions()}
          totalSessions={getTotalSessions()}
          activeCourses={courseProgress.length}
        />

        {/* Course Progress List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
          </div>
          
          {courseProgress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No progress yet</h3>
              <p className="text-gray-600">Start learning to track your progress here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {courseProgress.map((course, idx) => (
                <div key={course.courseId ?? `course-${idx}`} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {course.courseTitle}
                        </h4>
                        {course.completedSessions === course.totalSessions && course.totalSessions > 0 && (
                          <div className="ml-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                    
                    <div className="ml-6 flex-shrink-0">
                      <div className="w-32">
                        <div className="flex justify-between text-sm text-gray-600 mb-1" role="presentation">
                          <div>Progress</div>
                          <div>
                            {Math.round(getProgressPercentage(course.completedSessions, course.totalSessions))}%
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
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
