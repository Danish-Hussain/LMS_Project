import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/client'
import urlFor from '@/sanity/urlFor'
import { getBlogById } from '../../../src/lib/blogStorage'
import { PortableText } from 'next-sanity'
import BackButton from '@/components/BackButton/BackButton'
import PostViews from '@/components/PostViews/PostViews'

const POST_QUERY = `*[_type=='post' && slug.current == $slug][0]{_id, title, publishedAt, image, body, views, topics}`
const options = { next: { revalidate: 30 } }

const portableTextComponents = {
  types: {
    code: ({ value }: any) => {
        const code = value?.code || ''
        const lang = (value?.language || '').toLowerCase()

        // simple XML pretty-printer
        const formatXml = (xml: string) => {
          if (!xml) return xml
          // insert line breaks
          const withBreaks = xml.replace(/>(\s*)</g, '>$1\n<')
          let pad = 0
          const lines = withBreaks.split(/\r?\n/)
          const formatted = lines
            .map((line) => {
              line = line.trim()
              if (!line) return ''
              if (line.match(/^<\/?\w[^>]*>$/) && line.startsWith('</')) {
                pad = Math.max(pad - 1, 0)
              }
              const out = '  '.repeat(pad) + line
              if (line.match(/^<\w[^>]*[^\/]>/) && !line.includes('</')) {
                pad += 1
              }
              return out
            })
            .filter(Boolean)
            .join('\n')

          // Collapse empty element pairs so empty tags render inline:
          // <name>\n</name>  ->  <name></name>
          const linesAfter = formatted.split('\n')
          const collapsed: string[] = []
          for (let i = 0; i < linesAfter.length; i++) {
            const cur = linesAfter[i]
            const next = linesAfter[i + 1]
            if (next) {
              const openMatch = cur.trim().match(/^<([A-Za-z0-9_:-]+)(\s[^>]*)?>$/)
              const closeMatch = next.trim().match(/^<\/[A-Za-z0-9_:-]+>$/)
              if (openMatch && closeMatch) {
                // same tag name? ensure by comparing name in close
                const closeNameMatch = next.trim().match(/^<\/(\w[A-Za-z0-9_:-]*)>$/)
                if (closeNameMatch && closeNameMatch[1] === openMatch[1]) {
                  const indent = (cur.match(/^\s*/)?.[0]) || ''
                  collapsed.push(indent + cur.trim() + next.trim())
                  i++ // skip next
                  continue
                }
              }
            }
            collapsed.push(cur)
          }
          return collapsed.join('\n')
        }

        const pretty = lang === 'xml' ? formatXml(code) : code

        // small HTML escaper
        const escapeHtml = (str: string) =>
          str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')

        // Render XML as React nodes (safe — no innerHTML) with coloured spans
        const renderXmlNodes = (xml: string) => {
          // split into tags and text
          const parts = xml.split(/(<[^>]+>)/g).filter(Boolean)
          const nodes: any[] = []
          parts.forEach((part, idx) => {
            if (part.startsWith('<') && part.endsWith('>')) {
              // it's a tag — parse
              const isClose = /^<\s*\//.test(part)
              const tagMatch = part.match(/^<\s*\/?\s*([A-Za-z0-9_:-]+)/)
              const tagName = tagMatch ? tagMatch[1] : ''
              // attrs
              const attrs: Array<{ name: string; value: string }> = []
              const attrRegex = /([A-Za-z0-9_-]+)=("[^"]*"|'[^']*')/g
              let m: RegExpExecArray | null
              while ((m = attrRegex.exec(part)) !== null) {
                attrs.push({ name: m[1], value: m[2] })
              }

              nodes.push(<span key={`lt-${idx}`} className="text-gray-700">{'<'}</span>)
              if (isClose) {
                nodes.push(<span key={`slash-${idx}`} style={{ color: '#6a737d' }}>{'/'}</span>)
              }
              nodes.push(
                <span key={`tag-${idx}`} style={{ color: '#d73a49' }}>{tagName}</span>
              )
              attrs.forEach((a, ai) => {
                nodes.push(<span key={`sp-${idx}-${ai}`}>{' '}</span>)
                nodes.push(<span key={`an-${idx}-${ai}`} style={{ color: '#6f42c1' }}>{a.name}</span>)
                nodes.push(<span key={`eq-${idx}-${ai}`} className="text-gray-700">{`=`}</span>)
                nodes.push(<span key={`av-${idx}-${ai}`} style={{ color: '#032f62' }}>{a.value}</span>)
              })
              nodes.push(<span key={`gt-${idx}`} className="text-gray-700">{'>'}</span>)
            } else {
              // plain text
              nodes.push(<span key={`txt-${idx}`}>{part}</span>)
            }
          })
          return nodes
        }

        // basic Groovy highlighter: color keywords and strings
        const highlightGroovy = (src: string) => {
          const esc = escapeHtml(src)
          const keywords = ['def', 'class', 'return', 'if', 'else', 'import', 'for', 'while', 'in', 'new']
          let out = esc.replace(/(".*?"|'.*?')/g, (m) => `<span style="color:#032f62">${m}</span>`)
          const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
          out = out.replace(kwRegex, (m) => `<span style="color:#d73a49">${m}</span>`)
          return out
        }

        let highlighted: any = pretty
        if (lang === 'xml') highlighted = renderXmlNodes(pretty)
        else if (lang === 'groovy') highlighted = highlightGroovy(pretty)

        return (
          // render highlighted content inside code block
          <pre className="bg-gray-100 rounded p-4 overflow-auto my-4 text-sm">
            <code>{lang === 'xml' ? highlighted : <span dangerouslySetInnerHTML={{ __html: highlighted }} />}</code>
          </pre>
        )
      },
    image: ({ value }: any) => {
      // Sanity image block: build a URL and render it
      if (!value) return null
      try {
        const src = value?.asset ? urlFor(value).width(800).url() : value?.url
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={value?.alt || ''} className="my-4 max-w-full" />
        ) : null
      } catch (e) {
        return null
      }
    },
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
  let post: any = null
  try {
    post = await client.fetch(POST_QUERY, { slug: params.slug }, options)
  } catch (err) {
    // Sanity client failed (missing env or network). Try local fallback by slug -> id
    try {
      const local = await getBlogById(params.slug)
      if (local) {
        // map local blog shape to expected post shape used below
        post = {
          _id: local.id,
          title: local.title,
          publishedAt: local.createdAt,
          image: local.coverImage ? { asset: { _ref: local.coverImage } } : null,
          body: local.content || [],
          views: (local as any).views ?? 0,
          topics: local.topic || {},
          slug: { current: local.id },
        }
      }
    } catch (e) {
      // ignore and let notFound trigger below
    }
  }

  if (!post) return notFound()

  const hero = (post as any).image ? urlFor((post as any).image).width(1200).height(600).fit('crop').url() : null

  // Determine active topic keys from the checkbox-style topics object
  const topicKeys: string[] = post?.topics && typeof post.topics === 'object'
    ? Object.keys(post.topics).filter((k) => (post.topics as any)[k])
    : []

  // Fetch related posts (server-side) matching any of the same topic keys, exclude current post
  let relatedPostsData: any[] = []
  if (topicKeys.length > 0) {
    const topicFilter = topicKeys.map((k) => `topics.${k} == true`).join(' || ')
    const RELATED_QUERY = `*[_type=='post' && (${topicFilter}) && defined(slug.current) && _id != $id] | order(publishedAt desc)[0...4]{_id, title, slug, publishedAt, image, "excerptBlock": body[0], topics, views}`
    const related = await client.fetch(RELATED_QUERY, { id: post._id }, options)
    relatedPostsData = (related || []).map((r: any) => {
      const b = r?.excerptBlock
      const excerpt = b && b._type === 'block' && Array.isArray(b.children) ? (b.children || []).map((c: any) => c.text || '').join('').slice(0, 150) : ''
      const imageUrl = r?.image ? urlFor(r.image).width(1200).height(720).fit('crop').url() : null
      return {
        _id: r._id,
        title: r.title || '',
        slug: r.slug || { current: '' },
        publishedAt: r.publishedAt,
        publishedAtFormatted: r.publishedAt ? new Date(r.publishedAt).toISOString().slice(0, 10) : null,
        imageUrl,
        excerpt,
        topics: r.topics,
        views: r.views ?? 0,
      }
    })
  }

  return (
    <>
      <BackButton />
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mt-1">{post.title}</h1>
        <div className="text-sm text-gray-600 mb-4 flex items-center gap-3">
          <div>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</div>
          <div className="text-gray-500">•</div>
          <div className="text-gray-600">
            {/* client component will increment and render updated views count */}
            <PostViews slug={params.slug} initial={post.views ?? 0} />
          </div>
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

        {relatedPostsData.length > 0 && (
          <section className="mt-12">
            {/* thin divider directly above the heading */}
            <div className="border-t border-gray-200 dark:border-slate-700" />
            <h3 className="text-2xl font-semibold mt-4 mb-4">Related posts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPostsData.map((r) => (
                <article key={r._id} className="group rounded-lg border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 overflow-hidden">
                  <Link href={`/blogs/${r.slug.current}`} className="flex items-start gap-4 p-4">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt={r.title ?? ''} className="w-28 h-20 object-cover rounded-md flex-shrink-0" />
                    ) : (
                      <div className="w-28 h-20 bg-gray-200 dark:bg-slate-700 rounded-md flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-slate-100">{r.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">{r.excerpt}</p>
                      <div className="text-xs text-gray-500 mt-2">{r.publishedAtFormatted}</div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
