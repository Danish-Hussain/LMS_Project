import Link from 'next/link'
import { type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'
import BlogGrid from '@/components/BlogGrid/BlogGrid'
import { listBlogs } from '../../src/lib/blogStorage'

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
] | order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, "excerptBlock": body[0], topics, views}`

const options = { next: { revalidate: 30 } }

export default async function IndexPage() {
  let posts: SanityDocument[] = []

  try {
    posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options)
  } catch (err) {
    // Sanity not available (missing env/config or network). Fall back to local data.
    try {
      const local = await listBlogs()
      const localPosts = (local || []).slice(0, 12)
      const postsData = localPosts.map((post: any) => ({
        _id: post.id,
        title: post.title || '',
        slug: { current: post.id },
        publishedAt: post.createdAt,
        publishedAtFormatted: post.createdAt ? new Date(post.createdAt).toISOString().slice(0, 10) : null,
        imageUrl: post.coverImage || null,
        excerpt: (post.excerpt || '').slice(0, 150),
        topics: post.topic || {},
        views: post.views ?? 0,
      }))

      return (
        <main className="container mx-auto min-h-screen max-w-6xl p-8">
          <BlogGrid posts={postsData} />
        </main>
      )
    } catch (e) {
      // If even the local read fails, surface an empty list instead of throwing.
      return (
        <main className="container mx-auto min-h-screen max-w-6xl p-8">
          <BlogGrid posts={[]} />
        </main>
      )
    }
  }

  const postsData = posts.map((post) => {
    const b = (post as any).excerptBlock
    const excerpt = b && b._type === 'block' && Array.isArray(b.children) ? (b.children || []).map((c: any) => c.text || '').join('').slice(0, 150) : ''
    const imageUrl = (post as any).image ? urlFor((post as any).image).width(1200).height(720).fit('crop').url() : null
    return {
      _id: post._id,
      title: (post as any).title || '',
      slug: (post as any).slug || { current: '' },
      publishedAt: (post as any).publishedAt,
      // Provide a deterministic, server-rendered formatted date string to
      // avoid client/server locale mismatches during hydration. Use ISO
      // date (YYYY-MM-DD) which is locale-neutral.
      publishedAtFormatted: (post as any).publishedAt ? new Date((post as any).publishedAt).toISOString().slice(0, 10) : null,
      imageUrl,
      excerpt,
      topics: (post as any).topics,
      views: (post as any).views ?? 0,
    }
  })

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <BlogGrid posts={postsData} />
    </main>
  )
}
