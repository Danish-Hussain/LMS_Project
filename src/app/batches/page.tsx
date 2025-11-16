'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Plus, Users, Calendar, Edit, Trash2 } from 'lucide-react'

interface Batch {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
  course?: { title: string }
  _count: {
    students: number
    enrollments: number
  }
}

export default function BatchesPage() {
  const { user, loading } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBatches()
    }
  }, [user])

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches')
      if (response.ok) {
        const data = await response.json()
        setBatches(data)
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (batchId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBatches(batches.filter(batch => batch.id !== batchId))
      }
    } catch (error) {
      console.error('Failed to delete batch:', error)
    }
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

  const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'

  if (!isAdmin) {
    return (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to view batches.</p>
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

  return (
  <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
            <p className="text-gray-600 mt-2">Manage student batches and assignments</p>
          </div>
          <Link
            href="/batches/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Batch
          </Link>
        </div>

        {/* Batches Grid */}
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
            <p className="text-gray-600 mb-8">Create your first batch to get started.</p>
            <Link
              href="/batches/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Create Batch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div key={batch.id} className="rounded-lg shadow-md overflow-hidden" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
                      {batch.course?.title && (
                        <p className="text-sm text-gray-500 mt-0.5">Course: {batch.course.title}</p>
                      )}
                      {batch.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setConfirmDeleteId(batch.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(batch.startDate).toLocaleDateString()}
                        {batch.endDate && ` - ${new Date(batch.endDate).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{batch._count.students} students</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Link
                        href={`/batches/${batch.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <ConfirmDialog
          open={!!confirmDeleteId}
          title="Delete Batch"
          message="Are you sure you want to delete this batch?"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            if (confirmDeleteId) handleDelete(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      </div>
    </div>
  )
}
