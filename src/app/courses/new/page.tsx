'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { formatINR } from '@/lib/currency'

export default function CreateCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    actualPrice: '',
    discountPercent: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // switched from drag/drop upload to URL input that points to /public (e.g., /courses/apim.png)

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
      // Check authentication first
      if (!user || !user.id) {
        setError('You must be logged in to create a course')
        return
      }

      // Check authorization
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
        setError('Only admins and instructors can create courses')
        return
      }

      // Validate form data
      if (!formData.title.trim()) {
        setError('Course title is required')
        return
      }

      if (formData.title.trim().length > 255) {
        setError('Course title cannot exceed 255 characters')
        return
      }

      // Validate pricing inputs
      if (formData.actualPrice) {
        const ap = parseFloat(formData.actualPrice)
        if (isNaN(ap)) {
          setError('Actual price must be a valid number')
          return
        }
        if (ap < 0) {
          setError('Actual price cannot be negative')
          return
        }
        if (ap > 999999.99) {
          setError('Actual price is too high')
          return
        }
      }

      if (formData.discountPercent) {
        const dp = parseFloat(formData.discountPercent)
        if (isNaN(dp)) {
          setError('Discount must be a valid percentage')
          return
        }
        if (dp < 0 || dp > 100) {
          setError('Discount must be between 0 and 100')
          return
        }
      }

      // Final price field removed from UI; computed automatically during submission

      // No URL validation needed: thumbnail is set via PNG upload (optional)

      // Log the validated form data being sent
      console.log('Submitting course data:', {
        ...formData,
        userId: user.id,
        userRole: user.role
      })

      // Log the request being made
      console.log('Making request with user context:', { 
        userId: user?.id,
        userRole: user?.role,
        isAuthenticated: !!user 
      })

      // Compute final price from actual + discount (discount defaults to 0)
      const actualPriceNum = formData.actualPrice ? parseFloat(formData.actualPrice) : null
      const discountNum = formData.discountPercent ? Math.max(0, Math.min(100, parseFloat(formData.discountPercent))) : 0
      const finalPrice = (actualPriceNum != null)
        ? Math.round((actualPriceNum * (1 - discountNum / 100)) * 100) / 100
        : null

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thumbnail: (formData.thumbnail && formData.thumbnail.trim()) || '/uploads/CPI_Thumnail.png',
          price: finalPrice,
          discountPercent: discountNum
        })
      })

      let data: any = null
      let rawText = ''
      try {
        const ct = response.headers.get('content-type')?.toLowerCase() || ''
        if (ct.includes('application/json')) {
          data = await response.json()
        } else {
          // Non-JSON: read text only; don't try to parse
          rawText = await response.text()
        }
      } catch (parseError) {
        if (!rawText) {
          try { rawText = await response.text() } catch {}
        }
        console.error('Error parsing response:', parseError, { rawText })
        // Fallback to basic message if server returned non-JSON (e.g., HTML error page)
        setError(`Invalid response from server${response.status ? ` (HTTP ${response.status})` : ''}`)
        return
      }

      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      
      // Accept a few possible shapes to be resilient
      let createdId = data?.data?.id || data?.course?.id || data?.id
      if (!createdId) {
        const loc = response.headers.get('location') || response.headers.get('Location')
        if (loc) {
          const m = /\/courses\/([^\/\?#]+)/.exec(loc)
          if (m && m[1]) createdId = m[1]
        }
      }
      if ((response.status === 201 || response.ok) && createdId) {
        console.log('Course created successfully:', data.data || data)
        router.push(`/courses/${createdId}/options`)
      } else {
        // Handle specific error cases
        switch (response.status) {
          case 401:
            setError('Session expired. Please log in again')
            router.push('/login')
            break
          case 403:
            setError('You do not have permission to create courses')
            break
          case 404:
            setError('User account not found. Please log out and log in again')
            break
          case 409:
            setError('A course with this title already exists')
            break
          case 400:
            setError(data.error || 'Please check the form fields and try again')
            break
          default:
            console.error('Failed to create course:', {
              status: response.status,
              statusText: response.statusText,
              error: data?.error || data?.message,
              data,
              rawText
            })
            setError(
              data?.error ||
              data?.message ||
              (rawText ? rawText.slice(0, 300) : '') ||
              (response.ok ? 'Empty response from server' : '') ||
              `Failed to create course${response.status ? ` (HTTP ${response.status})` : ''}. Please try again later.`
            )
        }
      }
    } catch (err) {
      console.error('Course creation error:', err)
      setError('An error occurred while creating the course. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <p className="text-gray-600 mb-8">You don't have permission to create courses.</p>
          <Link
            href="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">
            Set up your course with basic information. You can add sessions later.
          </p>
        </div>

        <div className="rounded-lg shadow-md" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course title"
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
                  placeholder="Describe what students will learn in this course"
                />
              </div>

              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">Course Image (URL under /public)</label>
                <div>
                  <input
                    type="text"
                    id="thumbnail"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    placeholder="e.g., /courses/apim.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Store your image in <code>/public/courses</code> or <code>/public/uploads</code> and reference it as <strong>/courses/filename.png</strong> or <strong>/uploads/filename.png</strong>. Do not include <code>/public</code> in the URL.</p>
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail}
                      alt="Preview"
                      className="w-32 h-24 object-cover rounded-md border"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="actualPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Price (INR)
                  </label>
                  <input
                    type="number"
                    id="actualPrice"
                    name="actualPrice"
                    value={formData.actualPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 4999"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    id="discountPercent"
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 80"
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                {/* Final Price field removed: it will be calculated automatically from Actual Price and Discount */}
              </div>

              {/* Final price live preview */}
              {(() => {
                const ap = parseFloat(formData.actualPrice)
                const hasAp = !isNaN(ap)
                const dpRaw = parseFloat(formData.discountPercent)
                const dp = isNaN(dpRaw) ? 0 : Math.min(100, Math.max(0, dpRaw))
                const fp = hasAp ? Math.round(ap * (1 - dp / 100) * 100) / 100 : null
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
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Link
                href="/courses"
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
                    Create Course
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
