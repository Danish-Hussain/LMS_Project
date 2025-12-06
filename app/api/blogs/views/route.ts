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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slugsParam = url.searchParams.get('slugs') || ''
  const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean)

  if (slugs.length === 0) return NextResponse.json({})

  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
  if (token) {
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
      // fallthrough to file fallback
    }
  }

  try {
    const mapFile = await readViews()
    const out: Record<string, number> = {}
    slugs.forEach((s) => { out[s] = mapFile[s] ?? 0 })
    return NextResponse.json(out)
  } catch (err: any) {
    console.error('Error reading views (batch fallback):', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
