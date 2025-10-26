import { NextResponse } from 'next/server'
import { getBlogById, updateBlog } from '@/lib/blogStorage'

export async function GET(_req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = (await params) as { id: string }
  const blog = await getBlogById(id)
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(blog)
}

export async function PUT(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = (await params) as { id: string }
  try {
    const body = await req.json()
    const updated = await updateBlog(id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid body' }, { status: 400 })
  }
}

