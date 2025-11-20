import Link from 'next/link'
import { type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
] | order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, "excerptBlock": body[0]}`

const options = { next: { revalidate: 30 } }

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options)

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const excerpt = (() => {
            const b = (post as any).excerptBlock
            if (!b || b._type !== 'block' || !Array.isArray(b.children)) return ''
            return (b.children || []).map((c: any) => c.text || '').join('').slice(0, 150)
          })()

          const imageUrl = (post as any).image ? urlFor((post as any).image).width(1200).height(720).fit('crop').url() : null

          return (
            <article key={post._id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <Link href={`/blogs/${post.slug.current}`} className="block">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={post.title ?? ''} className="w-full h-48 md:h-56 lg:h-44 object-cover" />
                ) : (
                  <div className="w-full h-48 md:h-56 lg:h-44 bg-gray-100 dark:bg-slate-700" />
                )}

                <div className="p-4">
                  <h2 className="text-lg md:text-xl font-semibold mb-2 leading-tight text-slate-900 dark:text-slate-100">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{excerpt}{excerpt.length >= 150 ? '…' : ''}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</div>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}
