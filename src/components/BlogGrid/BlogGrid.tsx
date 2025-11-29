"use client"
import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'

type PostItem = {
  _id: string
  title: string
  slug: { current: string }
  publishedAt?: string
  publishedAtFormatted?: string | null
  imageUrl?: string | null
  excerpt?: string
  // topics can be either an array of strings (legacy) or an object of booleans (new checkbox-style)
  topics?: string[] | Record<string, boolean>
}

export default function BlogGrid({ posts }: { posts: PostItem[] }) {
  const [q, setQ] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [isLoading, setIsLoading] = useState(true)

  const TAGS = ['All', 'CPI', 'APIM', 'Event Mesh', 'EDI']

  const extractTopics = (p: PostItem) => {
    if (!p) return [] as string[]
    const t = (p as any).topics
    if (Array.isArray(t)) return t as string[]
    if (t && typeof t === 'object') {
      const MAP: Record<string, string> = { cpi: 'CPI', apim: 'APIM', eventMesh: 'Event Mesh', edi: 'EDI' }
      return Object.keys(t).filter((k) => t[k]).map((k) => MAP[k] ?? k)
    }
    const tags = (p as any).tags
    if (Array.isArray(tags)) return tags as string[]
    return [] as string[]
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

      return posts.filter((p) => {
      // Tag filter: if 'All' selected, pass; otherwise only match post.topics (strict match)
      if (selectedTag !== 'All') {
        const topics = extractTopics(p)
        const hasTag = Array.isArray(topics) ? topics.includes(selectedTag) : false
        if (!hasTag) return false
      }

      if (!term) return true
      const title = (p.title || '').toLowerCase()
      const excerpt = (p.excerpt || '').toLowerCase()
      return title.includes(term) || excerpt.includes(term)
    })
  }, [q, posts, selectedTag])

  useEffect(() => {
    // Simulate loading state for UX polish; if posts are already there, brief delay for skeleton visibility
    const t = setTimeout(() => setIsLoading(false), 350)
    return () => clearTimeout(t)
  }, [posts])

  const skeletonArray = Array.from({ length: 6 })

  return (
    <div className="text-slate-900 dark:text-slate-100">
  <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
          Blogs
        </h1>
      </header>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-2xl sm:flex-shrink-0">
          <label htmlFor="blog-search" className="sr-only">Search posts</label>
          <svg aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
          </svg>
          <input
            id="blog-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts by title or content…"
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-white/60 dark:bg-slate-800/70 border-gray-200 dark:border-white/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

  <div className="flex items-center gap-2 py-1 sm:py-0 sm:ml-4 sm:justify-end sm:flex-shrink-0">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={
                'whitespace-nowrap px-3 py-1 rounded-full text-sm border transition-colors ' +
                (selectedTag === tag
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-transparent shadow'
                  : 'bg-white/60 dark:bg-slate-800/70 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-sky-500/60')
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && skeletonArray.map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden h-full flex flex-col"
          >
            <div className="w-full h-48 md:h-56 lg:h-44 bg-gray-200/60 dark:bg-slate-700" />
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
              <div className="mt-auto h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/5" />
            </div>
          </div>
        ))}
        {!isLoading && filtered.map((post) => (
          <article
            key={post._id}
            className="group relative rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:shadow-xl transition-all overflow-hidden backdrop-blur-sm h-full flex flex-col"
          >
            <Link href={`/blogs/${post.slug.current}`} className="flex flex-col h-full">
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt={post.title ?? ''}
                  className="w-full h-48 md:h-56 lg:h-44 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-48 md:h-56 lg:h-44 bg-gradient-to-br from-slate-800 to-slate-700 grid place-items-center text-slate-300">
                  <span className="text-sm">No image</span>
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-lg md:text-xl font-semibold mb-2 leading-tight text-slate-900 dark:text-slate-100">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{post.excerpt}</p>
                ) : null}
                <div className="mt-auto text-xs text-gray-500 dark:text-gray-400">
                  {post.publishedAtFormatted ?? (post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0,10) : '')}
                </div>
              </div>
            </Link>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600/0 via-sky-600/40 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </article>
        ))}
      </div>
    </div>
  )
}
