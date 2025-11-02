'use client'

import { useEffect, useState } from 'react'
import useToast from '@/hooks/useToast'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function EditCoursePage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const courseId = params?.id ?? ''
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerImages, setPickerImages] = useState<{ path: string }[]>([])
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
      // Normalize thumbnail to avoid leading "/public" which is not part of the URL path at runtime
      const normalizeThumbnail = (val: string) => {
        if (!val) return val
        const t = val.trim()
        if (t.startsWith('/public/')) return t.replace(/^\/public/, '')
        return t
      }

      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thumbnail: normalizeThumbnail(formData.thumbnail),
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

  const openPicker = async () => {
    try {
      setPickerOpen(true)
      setPickerLoading(true)
      const res = await fetch('/api/public-images')
      if (res.ok) {
        const data = await res.json()
        setPickerImages((data.images || []).map((i: any) => ({ path: i.path })))
      } else {
        const data = await res.json().catch(() => ({}))
        toastError(data.error || 'Failed to load images')
      }
    } catch (e) {
      console.error(e)
      toastError('Failed to load images')
    } finally {
      setPickerLoading(false)
    }
  }

  const selectImage = (p: string) => {
    setFormData(prev => ({ ...prev, thumbnail: p }))
    setPickerOpen(false)
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
            <div className="flex gap-2">
              <input name="thumbnail" value={formData.thumbnail} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              <button type="button" onClick={openPicker} className="px-3 py-2 border rounded-md hover:bg-gray-50">Browse</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Images in <code>/public</code> are served from the root. Use paths like <strong>/uploads/APIM_Thumnail.png</strong> (do not include <code>/public</code>).</p>
            {pickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[70vh] flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Select an image</h3>
                    <button type="button" className="text-sm" onClick={() => setPickerOpen(false)}>Close</button>
                  </div>
                  <div className="p-4 overflow-auto">
                    {pickerLoading ? (
                      <div className="text-center text-gray-500">Loading…</div>
                    ) : pickerImages.length === 0 ? (
                      <div className="text-center text-gray-500">No images found in /public/uploads or /public/courses</div>
                    ) : (
                      <ul className="space-y-2">
                        {pickerImages.map(img => (
                          <li key={img.path} className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.path} alt={img.path} className="w-16 h-12 object-cover rounded border" />
                            <div className="flex-1 text-sm truncate">{img.path}</div>
                            <button type="button" onClick={() => selectImage(img.path)} className="px-2 py-1 text-sm border rounded">Use</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
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
