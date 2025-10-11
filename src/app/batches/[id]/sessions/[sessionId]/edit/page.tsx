"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditSessionPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  const sessionId = (params as any).sessionId as string

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, sessionRes] = await Promise.all([
          fetch(`/api/batches/${batchId}/sections`, { credentials: 'same-origin' }),
          fetch(`/api/sessions/${sessionId}`, { credentials: 'same-origin' })
        ])

        if (sRes.ok) setSections(await sRes.json())
        if (sessionRes.ok) {
          const data = await sessionRes.json()
          setFormData({
            title: data.title || '',
            description: data.description || '',
            videoUrl: data.videoUrl || '',
            duration: data.duration ? String(data.duration) : '',
            order: data.order ? String(data.order) : '1',
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            sectionId: data.sectionId || null
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    if (!loading) load()
  }, [batchId, sessionId, loading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          videoUrl: formData.videoUrl,
          duration: formData.duration ? parseInt(formData.duration) : null,
          order: parseInt(formData.order) || 1,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          sectionId: (formData as any).sectionId || null
        })
      })

      if (response.ok) {
        router.push(`/batches/${batchId}/sessions`)
      } else {
        const err = await response.json().catch(() => ({}))
        setError(err.error || 'Failed to update session')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit sessions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/batches/${batchId}/sessions`} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Sessions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Session</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">{error}</div>}

            <div className="space-y-6">
              <div>
                <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select id="sectionId" name="sectionId" value={formData.sectionId || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Unassigned</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Session Title *</label>
                <input id="title" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">Video URL *</label>
                <input id="videoUrl" name="videoUrl" type="url" required value={formData.videoUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <input id="order" name="order" type="number" value={formData.order} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                  <input id="startTime" name="startTime" type="datetime-local" value={formData.startTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                  <input id="endTime" name="endTime" type="datetime-local" value={formData.endTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Link href={`/batches/${batchId}/sessions`} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">Cancel</Link>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center disabled:opacity-50">
                {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
