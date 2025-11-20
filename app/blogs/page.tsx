import Link from 'next/link'
import { type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'
import BlogGrid from '@/components/BlogGrid/BlogGrid'

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
] | order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, "excerptBlock": body[0]}`

const options = { next: { revalidate: 30 } }

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options)

  const postsData = posts.map((post) => {
    const b = (post as any).excerptBlock
    const excerpt = b && b._type === 'block' && Array.isArray(b.children) ? (b.children || []).map((c: any) => c.text || '').join('').slice(0, 150) : ''
    const imageUrl = (post as any).image ? urlFor((post as any).image).width(1200).height(720).fit('crop').url() : null
    return {
      _id: post._id,
      title: (post as any).title || '',
      slug: (post as any).slug || { current: '' },
      publishedAt: (post as any).publishedAt,
      imageUrl,
      excerpt,
    }
  })

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <BlogGrid posts={postsData} />
    </main>
  )
}
