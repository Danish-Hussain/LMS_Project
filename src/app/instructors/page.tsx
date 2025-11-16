"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

type Instructor = {
  id: string
  name: string
  email: string
  canCreateBlogs?: boolean | null
  canCreateCourses?: boolean | null
}

export default function InstructorsPage() {
  const { user, loading } = useAuth()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Instructor | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roles: { blogs: false, courses: false }
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', roles: { blogs: false, courses: false } })
    setModalOpen(true)
  }
  const openEdit = (i: Instructor) => {
    setEditing(i)
    setForm({
      name: i.name,
      email: i.email,
      password: '',
      roles: { blogs: !!i.canCreateBlogs, courses: !!i.canCreateCourses }
    })
    setModalOpen(true)
  }

  const fetchInstructors = async () => {
    setError(null)
    try {
      const res = await fetch('/api/instructors', { credentials: 'same-origin' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setError(`Failed to load instructors (HTTP ${res.status})`)
        console.error('Instructors fetch failed:', res.status, text)
        return
      }
      const data = await res.json()
      setInstructors(data)
    } catch (e) {
      console.error('Instructors fetch error:', e)
      setError('Failed to load instructors')
    }
  }

  useEffect(() => { if (!loading) fetchInstructors() }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        roles: { blogs: !!form.roles.blogs, courses: !!form.roles.courses }
      }
      if (!editing) {
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        payload.password = form.password
      } else {
        // For edit, password change is not currently supported via API; omit password.
      }
      const res = await fetch(editing ? `/api/instructors/${editing.id}` : '/api/instructors', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg.error || 'Request failed')
      }
      setModalOpen(false)
      setEditing(null)
      await fetchInstructors()
    } catch (e: any) {
      setError(e.message || 'An error occurred')
    } finally { setBusy(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this instructor?')) return
    const res = await fetch(`/api/instructors/${id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (res.ok) fetchInstructors()
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-600">This page is available to admins only.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-gray-600 mt-1">Manage instructor accounts</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">Add Instructor</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--section-border)' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--section-border)' }}>
            {instructors.map((i) => (
              <tr key={i.id}>
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{i.name}</div>
                </td>
                <td className="px-6 py-3 text-gray-700">{i.email}</td>
                <td className="px-6 py-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    {i.canCreateBlogs ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Blogs</span>
                    ) : null}
                    {i.canCreateCourses ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">Courses</span>
                    ) : null}
                    {!i.canCreateBlogs && !i.canCreateCourses ? (
                      <span className="text-xs text-gray-400">None</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(i)} className="btn">Edit</button>
                    <button onClick={() => handleDelete(i.id)} className="btn text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-gray-500" colSpan={4}>No instructors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editing ? 'Edit Instructor' : 'Add Instructor'}</h2>
              <button onClick={() => { setModalOpen(false); setEditing(null) }} className="text-gray-500">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                {!editing && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <input type="password" className="w-full border rounded px-3 py-2" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters.</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Roles</label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" className="border rounded" checked={form.roles.blogs} onChange={e => setForm({ ...form, roles: { ...form.roles, blogs: e.target.checked } })} />
                      Blogs
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" className="border rounded" checked={form.roles.courses} onChange={e => setForm({ ...form, roles: { ...form.roles, courses: e.target.checked } })} />
                      Course
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : (editing ? 'Save Changes' : 'Create Instructor')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
