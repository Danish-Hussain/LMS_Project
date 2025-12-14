import { NextResponse } from 'next/server'
import { getServerClient } from '@/sanity/serverClient'

// This endpoint returns view counts for multiple slugs from Sanity. Local
// file-based fallback has been removed: views are canonical in Sanity only.

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slugsParam = url.searchParams.get('slugs') || ''
  const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean)

  if (slugs.length === 0) return NextResponse.json({})
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'Sanity token not configured. Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN.' }, { status: 500 })
  }

  try {
    const serverClient = getServerClient(token)
    // fetch all matching posts' slug and views in one query
    const q = `*[_type == "post" && slug.current in $slugs]{"slug": slug.current, "views": views}`
    const res = await serverClient.fetch(q, { slugs })
    const map: Record<string, number> = {}
    ;(res || []).forEach((r: any) => { if (r && r.slug) map[r.slug] = Number(r.views ?? 0) })
    // ensure every requested slug is present (default 0)
    slugs.forEach((s) => { if (typeof map[s] === 'undefined') map[s] = 0 })
    return NextResponse.json(map)
  } catch (err: any) {
    console.error('Error reading views from Sanity (batch):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
