'use client'

import { useState } from 'react'

interface SectionFormProps {
  batchId: string
  courseId: string
  initialData?: {
    id?: string
    title: string
    description?: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function SectionForm({
  batchId,
  courseId,
  initialData,
  onSuccess,
  onCancel
}: SectionFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  // description may be unused in some flows; keep underscore to show intentional retention
  const [description, _setDescription] = useState(initialData?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const url = initialData?.id 
        ? `/api/batches/${batchId}/sections/${initialData.id}`
        : `/api/batches/${batchId}/sections`
      
      console.log('Submitting section:', {
        url,
        method: initialData?.id ? 'PUT' : 'POST',
        data: {
          title,
          description,
          batchId,
          courseId
        }
      })

      const response = await fetch(url, {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          courseId,
          batchId
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Section created successfully:', data)
        onSuccess?.()
      } else {
        const data = await response.json()
        console.error('Failed to save section:', {
          status: response.status,
          statusText: response.statusText,
          data
        })
        setError(data.error || 'Failed to save section')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Section Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          placeholder="e.g., Introduction, Basic Concepts, etc."
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Section' : 'Create Section'}
        </button>
      </div>
    </form>
  )
}
