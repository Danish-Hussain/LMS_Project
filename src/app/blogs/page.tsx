"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useToast from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

type Blog = {
  id: string
  title: string
  coverImage?: string
  excerpt?: string
  content?: any
  topic?: string
  readingTime?: number
  views?: number
  isPublished?: boolean
  createdAt?: string
}

const TOPICS = ['CPI', 'APIM', 'Event Mesh', 'EDI']

export default function BlogsPage() {
  const { user } = useAuth()
  const isPrivileged = !!user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')
  const { success: toastSuccess, error: toastError } = useToast()
  const router = useRouter()

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', topic: TOPICS[0] })

  useEffect(() => {
    fetchBlogs()
  }, [])

  async function fetchBlogs() {
    setLoading(true)
    try {
      const res = await fetch('/api/blogs')
      if (res.ok) {
        const data = await res.json()
        // API may return either an array or an object with `blogs` field
        let list: Blog[] = []
        if (Array.isArray(data)) {
          list = data
        } else if (data?.blogs && Array.isArray(data.blogs)) {
          list = data.blogs
        } else if (data?.items && Array.isArray(data.items)) {
          list = data.items
        } else if (data && typeof data === 'object') {
          // sometimes API returns { blog: {...} } for single item; ignore
          list = []
        }
        setBlogs(list)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function firstImageFromContent(content: any) {
    if (!content) return null
    if (typeof content === 'string') return null
    if (Array.isArray(content)) {
      const img = content.find((blk: any) => blk?.type === 'image' && (blk?.data?.url || blk?.url))
      return img?.data?.url ?? img?.url ?? null
    }
    return null
  }

  const filtered = useMemo(() => {
    if (!selectedTopic) return blogs
    return blogs.filter(b => b.topic === selectedTopic)
  }, [blogs, selectedTopic])

  const openCreate = () => setCreating(true)
  const closeCreate = () => setCreating(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { title: form.title, topic: form.topic, content: [] }
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${base}/api/blogs`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const data = await res.json()
        // API may return either { blog: {...} } or the blog object directly
        const created = data?.blog ?? data
        if (!created || !created.id) {
          toastError('Created blog response missing id')
        } else {
          setBlogs(prev => [created, ...prev])
          toastSuccess('Draft created')
          setForm({ title: '', topic: TOPICS[0] })
          closeCreate()
          try {
            router.push(`/blogs/${created.id}/edit`)
          } catch (navErr) {
            console.error('Navigation failed', navErr)
          }
        }
      } else {
        let errMsg = 'Failed to create blog'
        try {
          const err = await res.json()
          errMsg = err?.error || errMsg
        } catch (parseErr) {
          console.error('Failed to parse error response', parseErr)
        }
        toastError(errMsg)
      }
    } catch (err: any) {
      console.error('Create blog failed', err)
      toastError(err?.message || 'Failed to create blog')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePublish = async (id: string, publish: boolean) => {
    try {
      const res = await fetch(`/api/blogs/${id}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publish }) })
      if (res.ok) {
        const data = await res.json()
        const updated = data?.blog ?? data
        if (updated && updated.id) {
          setBlogs(prev => prev.map(b => (b?.id === id ? updated : b)))
        }
        toastSuccess(publish ? 'Published' : 'Unpublished')
      } else {
        const err = await res.json()
        toastError(err?.error || 'Failed')
      }
    } catch (e) {
      console.error(e)
      toastError('Failed')
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Insights</h1>
          {isPrivileged && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white">
              <Plus className="h-4 w-4" /> Create
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setSelectedTopic(null)} className={`px-3 py-1.5 rounded-md ${selectedTopic === null ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>All</button>
          {TOPICS.map(t => (
            <button key={t} onClick={() => setSelectedTopic(t)} className={`px-3 py-1.5 rounded-md ${selectedTopic === t ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.filter(Boolean).map(b => {
              const cover = b.coverImage || firstImageFromContent(b.content)
              return (
                <article key={b.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <Link href={`/blogs/${b.id}`} className="block">
                    <div className="relative h-40 w-full overflow-hidden">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{b.readingTime ?? 0} min</div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2"><Link href={`/blogs/${b.id}`}>{b.title}</Link></h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{b.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{b.views ?? 0}</span>
                      </div>
                      <div className="text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {b.isPublished ? <span className="text-xs text-green-600">Published</span> : <span className="text-xs text-gray-500">Draft</span>}
                      </div>
                      {isPrivileged && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePublish(b.id, !b.isPublished)} className="text-xs px-2 py-1 border rounded">{b.isPublished ? 'Unpublish' : 'Publish'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-md p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create Blog</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} className="w-full border px-3 py-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Topic</label>
                <select value={form.topic} onChange={e => setForm(s => ({ ...s, topic: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <button type="button" onClick={closeCreate} disabled={submitting} className="px-4 py-2 border rounded disabled:opacity-60">Cancel</button>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{submitting ? 'Creating…' : 'Create'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
