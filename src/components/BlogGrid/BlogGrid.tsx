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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return posts
    return posts.filter((p) => {
      const title = (p.title || '').toLowerCase()
      const excerpt = (p.excerpt || '').toLowerCase()
      return title.includes(term) || excerpt.includes(term)
    })
  }, [q, posts])

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="blog-search" className="sr-only">
          Search posts
        </label>
        <input
          id="blog-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts by title or content…"
          className="w-full max-w-xl px-4 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
        />
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
