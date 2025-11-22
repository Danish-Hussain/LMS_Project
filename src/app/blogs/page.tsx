import Link from 'next/link'
import { type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'

// include topics so we can filter by them
const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...100]{_id, title, slug, publishedAt, topics}`

const options = { next: { revalidate: 30 } }

const ALL_TOPICS = ['CPI', 'APIM', 'Event Mesh', 'EDI'] as const

// map possible legacy values to the desired display value
const DISPLAY_MAP: Record<string, string> = {
  'API Management': 'APIM',
  APIM: 'APIM',
}

function displayTopic(t: string) {
  return DISPLAY_MAP[t] ?? t
}

export default async function IndexPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options)

  // normalize selected topics from query param (supports ?topic=A&topic=B)
  const raw = searchParams?.topic
  const selectedTopics = Array.isArray(raw) ? raw : raw ? [raw] : []

  const q = Array.isArray(searchParams?.q) ? String(searchParams?.q[0]) : (searchParams?.q as string | undefined)
  const qLower = q ? q.toLowerCase() : ''

  // filter posts by selected topics (accept APIM or legacy "API Management") and search query (title)
  const filtered = posts.filter((p: any) => {
    if (selectedTopics.length) {
      const has = Array.isArray(p.topics) && p.topics.some((t: string) => {
        // if user selected APIM, accept either 'APIM' or legacy 'API Management'
        if (selectedTopics.includes('APIM')) {
          if (t === 'APIM' || t === 'API Management') return true
        }
        return selectedTopics.includes(t)
      })
      if (!has) return false
    }

    if (qLower) {
      return String(p.title || '').toLowerCase().includes(qLower)
    }

    return true
  })

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-4">Posts</h1>
      <p className="text-slate-600 mb-6">Expert insights, real-world scenarios, and practical guides on SAP Integration—all in one place.</p>

      <form method="get" className="mb-6" action="/blogs">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search posts by title or content..."
              className="w-full rounded-lg border p-4 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <a href="/blogs" className="px-3 py-1 rounded-full border">All</a>
            {ALL_TOPICS.map((t) => {
              // treat legacy 'API Management' as APIM for selection purposes
              const isSelected = selectedTopics.includes(t) || (t === 'APIM' && selectedTopics.includes('API Management'))

              // build new topic list for the link: toggle this topic
              let newTopics: string[]
              if (isSelected) {
                // removing: if toggling APIM off, remove both APIM and legacy API Management
                if (t === 'APIM') {
                  newTopics = selectedTopics.filter((s) => s !== 'APIM' && s !== 'API Management')
                } else {
                  newTopics = selectedTopics.filter((s) => s !== t)
                }
              } else {
                // adding: add canonical topic value (APIM) and drop legacy API Management if present
                newTopics = selectedTopics.filter((s) => s !== 'API Management')
                newTopics = [...newTopics, t]
              }

              const params = new URLSearchParams()
              if (q) params.set('q', q)
              newTopics.forEach((nt) => params.append('topic', nt))
              const href = `/blogs${params.toString() ? `?${params.toString()}` : ''}`

              return (
                <a key={t} href={href} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${isSelected ? 'bg-violet-600 text-white' : ''}`}>
                  <span>{displayTopic(t)}</span>
                </a>
              )
            })}
          </div>
        </div>
      </form>

      <ul className="flex flex-col gap-y-4">
        {filtered.map((post: any) => (
          <li className="hover:underline" key={post._id}>
            <Link href={`/blogs/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-slate-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</p>
              {Array.isArray(post.topics) && post.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.topics.map((t: string) => (
                    <span key={t} className="px-2 py-1 text-xs bg-slate-100 rounded">{displayTopic(t)}</span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}