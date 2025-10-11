'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Users, Calendar, Plus, Edit, Trash2 } from 'lucide-react'
import { SessionListItem } from '@/components/SessionListItem'

interface Session {
  id: string
  title: string
  description: string | null
  videoUrl: string
  duration: number | null
  order: number
  isPublished: boolean
}

interface Batch {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  course: {
    id: string
    title: string
    price: number | null
  }
  sessions: Session[]
  _count: {
    students: number
    enrollments: number
  }
}

export default function BatchDetailPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const batchId = params.id as string
  
  const [batch, setBatch] = useState<Batch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, { completed: boolean }>>({})
  
  const isAdmin = useMemo(() => 
    user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR'
  , [user?.role])

  useEffect(() => {
    if (user && batchId) {
      fetchBatch()
    }
  }, [user, batchId])

  useEffect(() => {
    if (user && batch && !isAdmin) {
      fetchProgress()
    }
  }, [user, batch, isAdmin])

  const fetchProgress = async () => {
    try {
      const promises = batch?.sessions.map(async (session) => {
        const response = await fetch(`/api/progress?sessionId=${session.id}`)
        if (response.ok) {
          const data = await response.json()
          return [session.id, data]
        }
        return null
      }) || []

      const results = await Promise.all(promises)
      const progressMap = Object.fromEntries(
        results
          .filter((result): result is [string, any] => result !== null)
          .map(([id, data]) => [id, { completed: data?.completed || false }])
      )
      setProgress(progressMap)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const fetchBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}`)
      if (response.ok) {
        const data = await response.json()
        setBatch(data)
      }
    } catch (error) {
      console.error('Failed to fetch batch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    // handled by ConfirmDialog
  }

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const doDeleteBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Redirect to batches page
        window.location.href = '/batches'
      }
    } catch (error) {
      console.error('Failed to delete batch:', error)
    }
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
          <p className="text-gray-600 mb-8">Please log in to view batches.</p>
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don&apos;t have permission to view batch details.</p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Batch Not Found</h1>
          <p className="text-gray-600 mb-8">The batch you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/batches"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Batches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/batches"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Batches
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{batch.name}</h1>
              <p className="text-gray-600 mt-2">{batch.description}</p>
              <div className="flex items-center mt-4 space-x-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{batch._count.students} students</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(batch.startDate).toLocaleDateString()}
                    {batch.endDate && ` - ${new Date(batch.endDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Course: {batch.course.title}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href={`/batches/${batchId}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Batch
              </Link>
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Batch Sessions
                  </h3>
                  <Link
                    href={`/batches/${batchId}/sessions`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Sessions
                  </Link>
                </div>
                
                {batch.sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                    <p className="text-gray-600 mb-4">Add video sessions to this batch.</p>
                    <Link
                      href={`/batches/${batchId}/sessions`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Manage Sessions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batch.sessions
                      .sort((a, b) => a.order - b.order)
                      .map((session) => (
                      <SessionListItem
                        key={session.id}
                        id={session.id}
                        title={session.title}
                        description={session.description}
                        duration={session.duration}
                        isPublished={session.isPublished}
                        isInstructor={isAdmin}
                        isCompleted={progress[session.id]?.completed}
                        onStatusChange={async (id, completed) => {
                          setProgress(prev => ({
                            ...prev,
                            [id]: { completed }
                          }))
                        }}
                        onEdit={(id) => {
                          window.location.href = `/batches/${batchId}/sessions/${id}/edit`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Batch Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Batch Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      batch.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Course</label>
                  <p className="mt-1 text-sm text-gray-900">{batch.course.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {batch.course.price ? `$${batch.course.price}` : 'Free'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Students</label>
                  <p className="mt-1 text-sm text-gray-900">{batch._count.students} enrolled</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Sessions</label>
                  <p className="mt-1 text-sm text-gray-900">{batch.sessions.length} sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Batch"
        message="Are you sure you want to delete this batch?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          doDeleteBatch()
          setConfirmDeleteOpen(false)
        }}
      />
    </div>
  )
}
