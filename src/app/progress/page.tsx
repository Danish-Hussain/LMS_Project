'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { TrendingUp, CheckCircle, Clock, BookOpen, PlayCircle } from 'lucide-react'

interface ProgressItem {
  id: string
  watchedTime: number
  completed: boolean
  completedAt: string | null
  session: {
    id: string
    title: string
    duration: number | null
    course: {
      id: string
      title: string
      thumbnail: string | null
    }
  }
}

export default function ProgressPage() {
  const { user, loading } = useAuth()
  const [progress, setProgress] = useState<ProgressItem[]>([])
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
        setProgress(data)
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercentage = (watchedTime: number, duration: number | null) => {
    if (!duration) return 0
    return Math.min((watchedTime / duration) * 100, 100)
  }

  const getTotalProgress = () => {
    const totalSessions = progress.length
    const completedSessions = progress.filter(item => item.completed).length
    return totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
  }

  const getTotalWatchTime = () => {
    return progress.reduce((total, item) => total + item.watchedTime, 0)
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(getTotalProgress())}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.filter(item => item.completed).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <PlayCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{progress.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Watch Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(getTotalWatchTime() / 60)} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Session Progress</h3>
          </div>
          
          {progress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No progress yet</h3>
              <p className="text-gray-600">Start watching sessions to track your progress here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {progress.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.session.title}
                        </h4>
                        {item.completed && (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {item.session.course.title}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {Math.floor(item.watchedTime / 60)} min watched
                            {item.session.duration && ` / ${item.session.duration} min`}
                          </span>
                        </div>
                        {item.completedAt && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>
                              Completed {new Date(item.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <div className="w-32">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              getProgressPercentage(item.watchedTime, item.session.duration)
                            )}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${getProgressPercentage(
                                item.watchedTime,
                                item.session.duration
                              )}%`
                            }}
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
