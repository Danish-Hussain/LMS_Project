import { NextResponse } from 'next/server'
import { getServerClient } from '@/sanity/serverClient'
import fs from 'fs/promises'
import path from 'path'

const VIEWS_DATA = path.join(process.cwd(), 'data', 'views.json')

async function readViews(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(VIEWS_DATA, 'utf-8')
    return JSON.parse(raw) as Record<string, number>
  } catch (e: any) {
    if (e?.code === 'ENOENT') return {}
    throw e
  }
}

async function writeViews(data: Record<string, number>) {
  await fs.mkdir(path.dirname(VIEWS_DATA), { recursive: true })
  await fs.writeFile(VIEWS_DATA, JSON.stringify(data, null, 2), 'utf-8')
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  // If a Sanity write token is configured, prefer updating the canonical document in Sanity.
  if (token) {
    const serverClient = getServerClient(token)
    try {
      // resolve the document ID for the slug
      const q = `*[_type == "post" && slug.current == $slug][0]{_id}`
      const res = await serverClient.fetch(q, { slug })
      if (!res || !res._id) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      const id = res._id

      // Patch: ensure views exists and increment by 1 atomically
      await serverClient
        .patch(id)
        .setIfMissing({ views: 0 })
        .inc({ views: 1 })
        .commit()

      // fetch the updated document to return the current views count
      const updated = await serverClient.getDocument(id)
      return NextResponse.json({ views: (updated?.views ?? 0) }, { status: 200 })
    } catch (err: any) {
      console.error('Error incrementing views (sanity):', err)
      // fall through to file fallback
    }
  }

  // Fallback: persist view counts to a local JSON file under data/views.json
  try {
    const map = await readViews()
    const prev = map[slug] ?? 0
    const next = prev + 1
    map[slug] = next
    await writeViews(map)
    return NextResponse.json({ views: next }, { status: 200 })
  } catch (err: any) {
    console.error('Error incrementing views (fallback):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
