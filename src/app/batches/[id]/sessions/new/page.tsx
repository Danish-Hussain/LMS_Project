'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateSessionPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  type FormShape = {
    title: string
    description: string
    videoUrl: string
    duration: string
    order: string
    startTime: string
    endTime: string
    sectionId?: string | null
  }

  const [formData, setFormData] = useState<FormShape>({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    order: '',
    startTime: '',
    endTime: '',
    sectionId: null
  })
  const [sections, setSections] = useState<Array<{id:string;title:string}>>([])
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // If a File was selected, upload it and set videoUrl
      const fileInput = document.getElementById('videoFile') as HTMLInputElement | null
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0]
        const arrayBuffer = await file.arrayBuffer()
        const contentBase64 = Buffer.from(arrayBuffer).toString('base64')
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentBase64 })
        })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          formData.videoUrl = url
        }
      }
      // Require either URL or upload
      if (!formData.videoUrl) {
        const fileInput = document.getElementById('videoFile') as HTMLInputElement | null
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
          setError('Provide a Video URL or upload a video file')
          setIsSubmitting(false)
          return
        }
      }

      const response = await fetch(`/api/batches/${batchId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          videoUrl: formData.videoUrl,
          batchId,
          duration: formData.duration ? parseInt(formData.duration) : null,
          order: parseInt(formData.order) || 1,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          sectionId: (formData as any).sectionId || null
        })
      })

      if (response.ok) {
        const created = await response.json()
        // Redirect to edit page so user can immediately fine-tune the created session
        router.push(`/batches/${batchId}/sessions/${created.id}/edit`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create session')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    // preload sections for the batch and preselect section via query param if provided
    const load = async () => {
      try {
        const res = await fetch(`/api/batches/${batchId}/sections`, { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setSections(data)
          const sectionId = searchParams?.get('sectionId')
          if (sectionId) {
            setFormData(prev => ({ ...prev, sectionId }))
          }
        }
      } catch (e) {
        console.error('Failed to load sections', e)
      }
    }

    load()
  }, [batchId, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don&apos;t have permission to create sessions.</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/batches/${batchId}/sessions`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Sessions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Session</h1>
          <p className="text-gray-600 mt-2">
            Create a new video session for this batch.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  id="sectionId"
                  name="sectionId"
                  value={formData.sectionId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter session title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what will be covered in this session"
                />
              </div>

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL *
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  required
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/video.mp4"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the URL of the video file (MP4, WebM, etc.)
                </p>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or upload a video file
                  </label>
                  <input type="file" id="videoFile" accept="video/*" className="block w-full text-sm" />
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="60"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    min="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Order in which this session appears
                  </p>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start time
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End time
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Link
                href={`/batches/${batchId}/sessions`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
