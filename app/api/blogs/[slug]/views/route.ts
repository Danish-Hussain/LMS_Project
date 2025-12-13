import { NextResponse } from 'next/server'
import { getServerClient } from '@/sanity/serverClient'

// Note: runtime fallback to a local JSON file has been removed per repository
// policy — view counts must be stored in Sanity. The migration script
// `scripts/migrate-views-to-sanity.js` exists to import any existing values
// from `data/views.json` into Sanity before you remove that file from the
// repository.

export async function POST(request: Request, { params }: { params: any }) {
  // `params` can be an awaited proxy in Next.js app routes — await it before use.
  const { slug } = await params
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!token) {
    // Fail fast and clearly if Sanity write token is not configured.
    return NextResponse.json(
      { error: 'Sanity write token not configured. Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN.' },
      { status: 500 }
    )
  }

  try {
    const serverClient = getServerClient(token)
    // resolve the document ID for the slug
    const q = `*[_type == "post" && slug.current == $slug][0]{_id}`
    const res = await serverClient.fetch(q, { slug })
    if (!res || !res._id) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    const id = res._id

    // Patch: ensure views exists and increment by 1 atomically
    await serverClient.patch(id).setIfMissing({ views: 0 }).inc({ views: 1 }).commit()

    // fetch the updated document to return the current views count
    const updated = await serverClient.getDocument(id)
    return NextResponse.json({ views: updated?.views ?? 0 }, { status: 200 })
  } catch (err: any) {
    console.error('Error incrementing views (sanity):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function GET(_request: Request, { params }: { params: any }) {
  // `params` may be an awaited proxy; await before accessing properties.
  const { slug } = await params
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!token) {
    return NextResponse.json(
      { error: 'Sanity token not configured. Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN to read views.' },
      { status: 500 }
    )
  }

  try {
    const serverClient = getServerClient(token)
    const q = `*[_type == "post" && slug.current == $slug][0]{_id, views}`
    const res = await serverClient.fetch(q, { slug })
    if (!res) return NextResponse.json({ views: 0 }, { status: 200 })
    return NextResponse.json({ views: res.views ?? 0 }, { status: 200 })
  } catch (err: any) {
    console.error('Error reading views (sanity GET):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
