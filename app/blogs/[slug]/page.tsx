import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'

const POST_QUERY = `*[_type=='post' && slug.current == $slug][0]{_id, title, publishedAt, image, body}`
const options = { next: { revalidate: 30 } }

function renderPortableText(body: any[] | undefined) {
  if (!body || !Array.isArray(body)) return null
  return body.map((block, i) => {
    if (block._type === 'block') {
      const text = (block.children || []).map((c: any) => c.text || '').join('')
      return (
        <p className="mb-4" key={i}>
          {text}
        </p>
      )
    }
    // Fallback: JSON stringify for unknown block types
    return (
      <pre className="mb-4 text-sm text-gray-700" key={i}>
        {JSON.stringify(block)}
      </pre>
    )
  })
}

export default async function PostPage({ params }: any) {
  const post = await client.fetch(POST_QUERY, { slug: params.slug }, options)
  if (!post) return notFound()

  const hero = (post as any).image ? urlFor((post as any).image).width(1200).height(600).fit('crop').url() : null

  return (
    <main className="max-w-3xl mx-auto p-8">
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero} alt={post.title ?? ''} className="w-full h-64 object-cover rounded-md mb-6" />
      ) : null}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-gray-600 mb-6">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
      </div>
      <article className="prose max-w-none">{renderPortableText(post.body)}</article>
    </main>
  )
}
