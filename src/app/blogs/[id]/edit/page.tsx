"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Block = {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'code' | 'embed'
  data: any
}

export default function BlogEditorPage() {
  const params = useParams() as { id: string }
  const id = params?.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (!id) return
    (async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/blogs/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || '')
          setTopic(data.topic || '')
          setBlocks(Array.isArray(data.content) ? data.content : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  function addBlock(type: Block['type']) {
    const b: Block = { id: Date.now().toString(), type, data: {} }
    switch (type) {
      case 'heading':
        b.data = { level: 2, text: '' }
        break
      case 'paragraph':
        b.data = { text: '' }
        break
      case 'image':
        b.data = { url: '', alt: '' }
        break
      case 'quote':
        b.data = { text: '' }
        break
      case 'code':
        b.data = { language: 'text', code: '' }
        break
      case 'embed':
        b.data = { url: '' }
        break
    }
    setBlocks(s => [...s, b])
  }

  function updateBlock(id: string, patch: Partial<Block['data']>) {
    setBlocks(s => s.map(b => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)))
  }

  function removeBlock(id: string) {
    setBlocks(s => s.filter(b => b.id !== id))
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    setBlocks(s => {
      const idx = s.findIndex(b => b.id === id)
      if (idx === -1) return s
      const copy = [...s]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= copy.length) return s
      const tmp = copy[swap]
      copy[swap] = copy[idx]
      copy[idx] = tmp
      return copy
    })
  }

  async function uploadFile(file: File) {
    const reader = new FileReader()
    return await new Promise<string>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          // strip header
          const base64 = dataUrl
          const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, data: base64 }) })
          const json = await res.json()
          if (res.ok) resolve(json.url)
          else reject(json.error || 'Upload failed')
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

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

  const renderBlock = (b: Block) => {
    if (!b) return null
    const data = b.data ?? {}
    switch (b.type) {
      case 'heading': {
        const level = data.level || 2
        if (level === 1) return <h1 className="text-2xl font-bold my-4">{data.text}</h1>
        if (level === 2) return <h2 className="text-xl font-semibold my-4">{data.text}</h2>
        return <h3 className="text-lg font-medium my-4">{data.text}</h3>
      }
      case 'paragraph':
        return <p className="my-3 text-base leading-7">{data.text}</p>
      case 'image':
        return data.url ? <img src={data.url} alt={data.alt || ''} className="max-w-full rounded my-3" /> : null
      case 'quote':
        return <blockquote className="border-l-4 pl-4 italic text-gray-700 my-3">{data.text}</blockquote>
      case 'code':
        return <pre className="bg-gray-100 p-3 rounded font-mono my-3 overflow-auto"><code>{data.code}</code></pre>
      case 'embed': {
        const src = toEmbedUrl(data.url || '')
        return src ? <iframe src={src} title="embed" className="w-full h-64 my-3" /> : null
      }
      default:
        return null
    }
  }

  async function handleSave(publish = false) {
    if (!id) return
    setSaving(true)
    try {
      // compute excerpt from first paragraph
      const firstParagraph = blocks.find(b => b.type === 'paragraph')?.data?.text || ''
      const excerpt = firstParagraph.slice(0, 200)
      const payload = { title, topic, content: blocks, excerpt, isPublished: publish }
      const res = await fetch(`/api/blogs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        // navigate back to blog view
        router.push(`/blogs/${id}`)
      } else {
        const err = await res.json()
        console.error('Save failed', err)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading editor…</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <input className="w-full text-2xl font-semibold border-b pb-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <input className="w-48 mt-2 border px-2 py-1" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(p => !p)} className="px-3 py-1 border rounded">{preview ? 'Hide preview' : 'Show preview'}</button>
          <button onClick={() => addBlock('heading')} className="px-3 py-1 border rounded">Heading</button>
          <button onClick={() => addBlock('paragraph')} className="px-3 py-1 border rounded">Paragraph</button>
          <button onClick={() => addBlock('image')} className="px-3 py-1 border rounded">Image</button>
          <button onClick={() => addBlock('quote')} className="px-3 py-1 border rounded">Quote</button>
          <button onClick={() => addBlock('code')} className="px-3 py-1 border rounded">Code</button>
          <button onClick={() => addBlock('embed')} className="px-3 py-1 border rounded">Embed</button>
        </div>
      </div>

      <div className={`flex gap-6 ${preview ? '' : ''}`}>
        <div className={`${preview ? 'w-1/2' : 'w-full'}`}>
          <div className="space-y-4">
            {blocks.map((b, i) => (
              <div key={b.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">{b.type.toUpperCase()}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveBlock(b.id, 'up')} disabled={i === 0} className="px-2 py-1 border rounded">↑</button>
                    <button onClick={() => moveBlock(b.id, 'down')} disabled={i === blocks.length - 1} className="px-2 py-1 border rounded">↓</button>
                    <button onClick={() => removeBlock(b.id)} className="px-2 py-1 border rounded">Delete</button>
                  </div>
                </div>

                {/* editor for each block type */}
                {b.type === 'heading' && (
                  <div>
                    <select value={b.data.level} onChange={e => updateBlock(b.id, { level: Number(e.target.value) })} className="border px-2 py-1 mr-2">
                      <option value={1}>H1</option>
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                    </select>
                    <input value={b.data.text} onChange={e => updateBlock(b.id, { text: e.target.value })} className="w-full border px-2 py-1 mt-2" />
                  </div>
                )}

                {b.type === 'paragraph' && (
                  <textarea value={b.data.text} onChange={e => updateBlock(b.id, { text: e.target.value })} className="w-full border px-2 py-1" rows={4} />
                )}

                {b.type === 'image' && (
                  <div>
                    <div className="flex gap-2">
                      <input placeholder="Image URL" value={b.data.url} onChange={e => updateBlock(b.id, { url: e.target.value })} className="w-full border px-2 py-1" />
                      <input type="file" accept="image/*" onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const url = await uploadFile(file)
                          updateBlock(b.id, { url })
                        } catch (err) {
                          console.error(err)
                        }
                      }} />
                    </div>
                    {b.data.url && <div className="mt-2"><img src={b.data.url} alt={b.data.alt || 'img'} className="max-w-full" /></div>}
                  </div>
                )}

                {b.type === 'quote' && (
                  <textarea value={b.data.text} onChange={e => updateBlock(b.id, { text: e.target.value })} className="w-full border px-2 py-1 italic" rows={3} />
                )}

                {b.type === 'code' && (
                  <div>
                    <input value={b.data.language} onChange={e => updateBlock(b.id, { language: e.target.value })} placeholder="language" className="border px-2 py-1 mb-2" />
                    <textarea value={b.data.code} onChange={e => updateBlock(b.id, { code: e.target.value })} className="w-full border px-2 py-1 font-mono" rows={6} />
                  </div>
                )}

                {b.type === 'embed' && (
                  <div>
                    <input placeholder="YouTube / Vimeo URL" value={b.data.url} onChange={e => updateBlock(b.id, { url: e.target.value })} className="w-full border px-2 py-1" />
                    {b.data.url && (
                      <div className="mt-2">
                        <iframe src={toEmbedUrl(b.data.url)} title="embed" className="w-full h-64" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving ? 'Saving…' : 'Publish'}</button>
            <button onClick={() => router.push(`/blogs/${id}`)} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>

        {preview && (
          <div className="w-1/2 border-l pl-6">
            <div className="prose">
              <h2 className="text-xl font-semibold mb-3">Preview</h2>
              {blocks.map(b => (
                <div key={b.id}>{renderBlock(b)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

