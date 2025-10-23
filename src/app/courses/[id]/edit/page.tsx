'use client'

import { useEffect, useState } from 'react'
import useToast from '@/hooks/useToast'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function EditCoursePage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    price: '',
    discountPercent: '',
    isPublished: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { info: toastInfo, error: toastError, success: toastSuccess } = useToast()

  useEffect(() => {
    if (user && courseId) fetchCourse()
  }, [user, courseId])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        const course = data.course
        setFormData({
          title: course.title || '',
          description: course.description || '',
          thumbnail: course.thumbnail || '',
          price: course.price != null ? String(course.price) : '',
          discountPercent: course.discountPercent != null ? String(course.discountPercent) : '',
          isPublished: !!course.isPublished
        })
      }
    } catch (err) {
      console.error('Failed to load course:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thumbnail: formData.thumbnail,
          price: formData.price,
          discountPercent: formData.discountPercent,
          isPublished: formData.isPublished
        })
      })

      if (res.ok) {
        router.push(`/courses/${courseId}`)
        } else {
        const data = await res.json()
        toastError(data.error || 'Failed to update course')
      }
    } catch (err) {
      console.error('Update failed:', err)
      toastError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit this course.</p>
          <Link href={`/courses/${courseId}`} className="mt-4 inline-block text-blue-600 underline">Back</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Course</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
            <input name="thumbnail" value={formData.thumbnail} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Price</label>
            <input name="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Discount (%)</label>
            <input name="discountPercent" value={formData.discountPercent} onChange={handleChange} type="number" min={0} max={100} className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div className="mb-4 flex items-center">
            <input id="isPublished" name="isPublished" type="checkbox" checked={formData.isPublished} onChange={handleChange} className="mr-2" />
            <label htmlFor="isPublished" className="text-sm">Published</label>
          </div>

          <div className="flex justify-end space-x-3">
            <Link href={`/courses/${courseId}`} className="px-4 py-2 border rounded-md">Cancel</Link>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
