'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useToast from '@/hooks/useToast'

function CreateRecordedCourseContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()

  const courseId = searchParams.get('courseId')
  const [formData, setFormData] = useState({
    price: '',
    actualPrice: '',
    discountPercent: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [courseName, setCourseName] = useState<string>('')
  const [courseLoading, setCourseLoading] = useState(true)

  // Fetch course name
  useEffect(() => {
    const fetchCourseName = async () => {
      if (!courseId) {
        setCourseLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          credentials: 'same-origin'
        })
        if (response.ok) {
          const data = await response.json()
          setCourseName(data.course?.title || courseId)
        } else {
          setCourseName(courseId)
        }
      } catch (err) {
        console.error('Failed to fetch course name:', err)
        setCourseName(courseId)
      } finally {
        setCourseLoading(false)
      }
    }

    fetchCourseName()
  }, [courseId])

  // Check if user is admin/instructor
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR'

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to create recorded courses.</p>
          <Link href="/courses" className="text-blue-600 hover:text-blue-700 font-semibold">
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!courseId) {
      setFormError('Course ID is missing')
      return
    }

    try {
      setIsSubmitting(true)

      // Compute final price: prefer actualPrice & discount if provided
      const ap = formData.actualPrice ? parseFloat(formData.actualPrice) : null
      const dp = formData.discountPercent ? Math.max(0, Math.min(100, parseFloat(formData.discountPercent))) : null
      const finalPrice = (ap != null && dp != null) ? Math.round((ap * (1 - dp / 100)) * 100) / 100 : (formData.price ? parseFloat(formData.price) : 0)

      const response = await fetch('/api/recorded-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          price: finalPrice,
          discountPercent: dp != null ? dp : undefined,
        }),
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create recorded course')
      }

      const recordedCourse = await response.json()
      toastSuccess('Recorded course created successfully!')

      // Redirect back to course page
      setTimeout(() => {
        router.push(`/courses/${courseId}`)
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setFormError(message)
      toastError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/courses/${courseId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Course
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Self-paced Course</h1>
          <p className="text-gray-600">Set up a new On-demand course for organizing students and their learning sessions.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {formError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection (Display only) */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Course
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {courseLoading ? 'Loading...' : (courseName || courseId)}
              </div>
              <p className="mt-1 text-sm text-gray-500">The parent course for this self-paced offering</p>
            </div>

            {/* Name/Description not required for on-demand creation; auto-generated server-side */}

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="actualPrice" className="block text-sm font-medium text-gray-900 mb-2">Actual Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="actualPrice"
                    name="actualPrice"
                    value={formData.actualPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-900 mb-2">Discount (%)</label>
                <input
                  type="number"
                  id="discountPercent"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                  className="w-full pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">Final Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">If you fill Actual + Discount, Final Price is auto-calculated on save.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/courses/${courseId}`)}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CreateRecordedCoursePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateRecordedCourseContent />
    </Suspense>
  )
}
