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
    videoUrl: string
    
    order: string
    sectionId?: string | null
  }

  const [formData, setFormData] = useState<FormShape>({
    title: '',
    videoUrl: '',
    order: '',
    sectionId: null
  })
  const [sections, setSections] = useState<Array<{id:string;title:string}>>([])
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null)

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
      // Require a Video URL
      if (!formData.videoUrl) {
        setError('Provide a Video URL')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/batches/${batchId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          videoUrl: formData.videoUrl,
          batchId,
          order: parseInt(formData.order) || 1,
          sectionId: formData.sectionId || null
        })
      })

      if (response.ok) {
        // After creating a session, go back to the sessions list page
        const session = await response.json()
        const sessionId = session.id

        // Upload documents if any
        if (documentFiles && documentFiles.length > 0) {
          for (let i = 0; i < documentFiles.length; i++) {
            const file = documentFiles[i]
            try {
              // Upload file first
              const arrayBuffer = await file.arrayBuffer()
              const contentBase64 = Buffer.from(arrayBuffer).toString('base64')
              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, contentBase64 })
              })
              
              if (uploadRes.ok) {
                const { url } = await uploadRes.json()
                // Add document to session
                await fetch(`/api/sessions/${sessionId}/documents`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: file.name,
                    url,
                    size: file.size,
                    mimeType: file.type
                  })
                })
              }
            } catch (err) {
              console.error('Failed to upload document:', file.name, err)
            }
          }
        }

        router.push(`/batches/${batchId}/sessions`)
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

              {/* Description removed per UI request */}

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
              </div>

              <div>
                <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Documents (Optional)
                </label>
                <input
                  type="file"
                  id="documents"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={(e) => setDocumentFiles(e.target.files)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload documents (PDFs, Word, Excel, PowerPoint, etc.) that students can download
                </p>
                {documentFiles && documentFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {Array.from(documentFiles).map((file, idx) => (
                        <li key={idx}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Start/End time removed as requested */}
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
