import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'
import { PortableText } from 'next-sanity'

const POST_QUERY = `*[_type=='post' && slug.current == $slug][0]{_id, title, publishedAt, image, body}`
const options = { next: { revalidate: 30 } }

const portableTextComponents = {
  types: {
    code: ({ value }: any) => (
      <pre className="bg-gray-100 rounded p-4 overflow-auto my-4 text-sm"><code>{value.code}</code></pre>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    code: ({ children }: any) => (
      <code className="px-1 py-0.5 rounded bg-gray-100 text-pink-700 text-sm font-mono">{children}</code>
    ),
    underline: ({ children }: any) => <span className="underline">{children}</span>,
    strike: ({ children }: any) => <span className="line-through">{children}</span>,
    link: ({ value, children }: any) => {
      const href = value?.href || '#'
      const target = value?.openInNewTab ? '_blank' : undefined
      return (
        <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className="text-blue-600 hover:underline">
          {children}
        </a>
      )
    },
  },
  block: {
    h1: ({ children }: any) => <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-3xl font-semibold mt-8 mb-4">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-2xl font-semibold mt-6 mb-3">{children}</h3>,
    normal: ({ children }: any) => <p className="mb-4 leading-relaxed">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 pl-4 italic my-4 text-gray-700">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li>{children}</li>,
    number: ({ children }: any) => <li>{children}</li>,
  },
}

export default async function PostPage({ params }: any) {
  const post = await client.fetch(POST_QUERY, { slug: params.slug }, options)
  if (!post) return notFound()

  const hero = (post as any).image ? urlFor((post as any).image).width(1200).height(600).fit('crop').url() : null

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mt-1">{post.title}</h1>
      <div className="text-sm text-gray-600 mb-4">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
      </div>
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero} alt={post.title ?? ''} className="w-full h-64 object-cover rounded-md mb-6" />
      ) : null}
      <article className="prose max-w-none">
        {Array.isArray(post.body) && (
          <PortableText value={post.body} components={portableTextComponents} />
        )}
      </article>
    </main>
  )
}
