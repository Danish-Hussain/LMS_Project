import { notFound } from 'next/navigation'
import { getBlogById } from '@/lib/blogStorage'
import BlogEditButton from '@/components/blogs/BlogEditButton'

function toEmbedUrl(url: string) {
  if (!url) return ''
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : url
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1)
      return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop()
      return id ? `https://player.vimeo.com/video/${id}` : url
    }
  } catch (e) {
    return url
  }
  return url
}

type Block = { id: string; type: string; data: any }

export default async function BlogView({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = (await params) as { id: string }
  const blog = await getBlogById(id)
  if (!blog) return notFound()

  const renderBlock = (b: Block) => {
    if (!b) return null
    switch (b.type) {
      case 'heading': {
        const level = b.data?.level ?? 2
        if (level === 1) return <h1 className="font-semibold my-4 text-3xl">{b.data?.text}</h1>
        if (level === 2) return <h2 className="font-semibold my-4 text-2xl">{b.data?.text}</h2>
        return <h3 className="font-semibold my-4 text-xl">{b.data?.text}</h3>
      }
      case 'paragraph':
        return <p className="my-3 text-base leading-relaxed">{b.data?.text}</p>
      case 'image':
        return b.data?.url ? <img src={b.data.url} alt={b.data?.alt || 'image'} className="my-4 max-w-full" /> : null
      case 'quote':
        return <blockquote className="border-l-4 pl-4 italic my-4 text-gray-700">{b.data?.text}</blockquote>
      case 'code':
        return <pre className="bg-gray-100 p-3 rounded my-3 overflow-auto"><code className="font-mono">{b.data?.code}</code></pre>
      case 'embed':
        return b.data?.url ? <div className="my-4"><iframe src={toEmbedUrl(b.data.url)} title="embed" className="w-full h-64" /></div> : null
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BlogEditButton id={id} />
      {blog.coverImage && <img src={blog.coverImage} alt="cover" className="w-full h-64 object-cover rounded mb-6" />}
      <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
      <div className="text-sm text-gray-500 mb-6">{blog.topic} · {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}</div>
      <div className="prose prose-lg">
        {Array.isArray(blog.content) && blog.content.map((b: Block) => (
          <div key={b.id}>{renderBlock(b)}</div>
        ))}
      </div>
    </div>
  )
}

