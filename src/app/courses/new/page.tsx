'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye } from 'lucide-react'

export default function CreateCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    price: ''
  })
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

      if (formData.price) {
        const price = parseFloat(formData.price)
        if (isNaN(price)) {
          setError('Price must be a valid number')
          return
        }
        if (price < 0) {
          setError('Price cannot be negative')
          return
        }
        if (price > 999999.99) {
          setError('Price is too high')
          return
        }
      }

      // Validate thumbnail URL if provided
      if (formData.thumbnail) {
        try {
          new URL(formData.thumbnail)
        } catch (e) {
          setError('Please enter a valid URL for the thumbnail')
          return
        }
      }

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

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null
        })
      })

      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        setError('Invalid response from server')
        return
      }

      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      
      if (response.ok && data.data?.id) {
        console.log('Course created successfully:', data.data)
        router.push(`/courses/${data.data.id}`)
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
              error: data.error,
              data
            })
            setError(data.error || 'Failed to create course. Please try again later.')
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
    <div className="min-h-screen bg-gray-50">
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

        <div className="bg-white rounded-lg shadow-md">
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
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded-md border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Price (USD)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00 (leave empty for free course)"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty for a free course
                </p>
              </div>
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
