'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useToast from '@/hooks/useToast'
import { formatINR } from '@/lib/currency'

function CreateRecordedCourseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()

  const courseId = searchParams?.get('courseId') ?? ''
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseId)
  const [formData, setFormData] = useState({
    actualPrice: '',
    discountPercent: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  

  // Fetch available courses for dropdown (admin: all, instructor: own, public: published)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        const res = await fetch('/api/courses', { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setCourses(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, title: c.title })) : [])
        } else {
          setCourses([])
        }
      } catch (e) {
        console.error('Failed to load courses list:', e)
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [])

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
    if (!selectedCourseId) {
      setFormError('Please select a course')
      return
    }

    try {
      setIsSubmitting(true)

  // Compute final price from actual price and discount (discount defaults to 0)
  const ap = formData.actualPrice ? parseFloat(formData.actualPrice) : null
  const dp = formData.discountPercent ? Math.max(0, Math.min(100, parseFloat(formData.discountPercent))) : 0
  const finalPrice = (ap != null) ? Math.round((ap * (1 - dp / 100)) * 100) / 100 : 0

      const response = await fetch('/api/recorded-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
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
        router.push(`/courses/${selectedCourseId}`)
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
          <Link href={selectedCourseId ? `/courses/${selectedCourseId}` : '/courses'} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
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
            {/* Course Selection */}
            <div>
              <label htmlFor="courseSelect" className="block text-sm font-medium text-gray-900 mb-2">
                Course
              </label>
              <select
                id="courseSelect"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isSubmitting || coursesLoading}
              >
                <option value="" disabled>{coursesLoading ? 'Loading courses…' : 'Select a course'}</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">The parent course for this self-paced offering</p>
            </div>

            {/* Name/Description not required for on-demand creation; auto-generated server-side */}

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="actualPrice" className="block text-sm font-medium text-gray-900 mb-2">Actual Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="actualPrice"
                    name="actualPrice"
                    value={formData.actualPrice}
                    onChange={handleChange}
                    placeholder="0"
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
              {/* Final Price field removed. */}
            </div>

            {/* Final price live preview */}
            {(() => {
              const apNum = parseFloat(formData.actualPrice)
              const hasAp = !isNaN(apNum)
              const dpRaw = parseFloat(formData.discountPercent)
              const dpNum = isNaN(dpRaw) ? 0 : Math.min(100, Math.max(0, dpRaw))
              const fp = hasAp ? Math.round(apNum * (1 - dpNum / 100) * 100) / 100 : null
              return (
                <div className="text-sm">
                  {hasAp ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 ring-1 ring-inset ring-green-200 px-3 py-1">
                      <span className="font-medium">Final price will be:</span>
                      <span className="font-semibold">{formatINR(fp ?? 0)}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">Enter Actual Price to see the final price preview.</span>
                  )}
                </div>
              )
            })()}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(selectedCourseId ? `/courses/${selectedCourseId}` : '/courses')}
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
