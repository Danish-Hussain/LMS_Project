import { NextResponse } from 'next/server'
import { getServerClient } from '@/sanity/serverClient'

/**
 * GET /api/admin/posts-views
 * Returns a JSON array of posts with { title, slug, views } fetched from Sanity.
 * This is a read-only endpoint and will work with a read-only Sanity client when
 * no token is provided. If you want to use a token, set SANITY_WRITE_TOKEN or
 * SANITY_API_TOKEN in the environment and the client will use it.
 */
export async function GET() {
  try {
    const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
    const client = getServerClient(token)

    const q = `*[_type == "post" && defined(slug.current)] | order(views desc){title, "slug": slug.current, views}`
    const posts = await client.fetch(q)

    return NextResponse.json({ posts }, { status: 200 })
  } catch (err: any) {
    console.error('Error fetching posts views (admin):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
