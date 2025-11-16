"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Batch = {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
}

export default function EditBatchPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{ name: string; description: string; startDate: string }>({
    name: '',
    description: '',
    startDate: ''
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/batches/${id}`)
        if (!res.ok) throw new Error('Failed to load batch')
        const data: Batch = await res.json()
        setForm({
          name: data.name || '',
          description: data.description || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : ''
        })
      } catch (e: any) {
        setError(e?.message || 'Failed to load batch')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined
        })
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Failed to update batch')
      }
      // go back to batch details
      router.push(`/batches/${id}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to update batch')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Edit Batch</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--session-subtext)' }}>Update batch details below.</p>

        {loading ? (
          <div className="py-20 text-center" style={{ color: 'var(--session-subtext)' }}>Loading…</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="border px-4 py-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={onChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ background: 'var(--background)', borderColor: 'var(--section-border)', color: 'var(--foreground)' }}
                placeholder="Enter batch name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={onChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ background: 'var(--background)', borderColor: 'var(--section-border)', color: 'var(--foreground)' }}
                placeholder="Enter batch description"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={onChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ background: 'var(--background)', borderColor: 'var(--section-border)', color: 'var(--foreground)' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href={`/batches/${id}`} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--section-border)', color: 'var(--foreground)' }}>Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
