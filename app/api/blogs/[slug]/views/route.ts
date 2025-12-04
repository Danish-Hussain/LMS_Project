import { NextResponse } from 'next/server'
import { getServerClient } from '@/sanity/serverClient'

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Missing SANITY write token. Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN.' }, { status: 500 })
  }

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
    console.error('Error incrementing views:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
