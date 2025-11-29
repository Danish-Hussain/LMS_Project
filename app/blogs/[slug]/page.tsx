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
          return formatted
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
