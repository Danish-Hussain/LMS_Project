"use client"
import React, { useMemo, useState } from 'react'
import Link from 'next/link'

type PostItem = {
  _id: string
  title: string
  slug: { current: string }
  publishedAt?: string
  imageUrl?: string | null
  excerpt?: string
}

export default function BlogGrid({ posts }: { posts: PostItem[] }) {
  const [q, setQ] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')

  const TAGS = ['All', 'CPI', 'API Management', 'Event Mesh', 'EDI']

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    return posts.filter((p) => {
      // Tag filter: if 'All' selected, pass; otherwise match post.tags if present or fallback to title/excerpt
      if (selectedTag !== 'All') {
        const tags = (p as any).tags
        const hasTag = Array.isArray(tags) ? tags.includes(selectedTag) : false
        const fallback = ((p.title || '') + ' ' + (p.excerpt || '')).toLowerCase().includes(selectedTag.toLowerCase())
        if (!hasTag && !fallback) return false
      }

      if (!term) return true
      const title = (p.title || '').toLowerCase()
      const excerpt = (p.excerpt || '').toLowerCase()
      return title.includes(term) || excerpt.includes(term)
    })
  }, [q, posts, selectedTag])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Blogs</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Expert insights, real-world scenarios, and practical guides on SAP Integration—all in one place.</p>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="blog-search" className="sr-only">Search posts</label>
          <input
            id="blog-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts by title or content…"
            className="w-full px-4 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2 sm:py-0">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={
                'whitespace-nowrap px-3 py-1 rounded-full text-sm border ' +
                (selectedTag === tag
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700')
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((post) => (
          <article key={post._id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <Link href={`/blogs/${post.slug.current}`} className="block">
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt={post.title ?? ''} className="w-full h-48 md:h-56 lg:h-44 object-cover" />
              ) : (
                <div className="w-full h-48 md:h-56 lg:h-44 bg-gray-100 dark:bg-slate-700" />
              )}

              <div className="p-4">
                <h2 className="text-lg md:text-xl font-semibold mb-2 leading-tight text-slate-900 dark:text-slate-100">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{post.excerpt}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
