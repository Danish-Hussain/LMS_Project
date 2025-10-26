import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { filename, data } = body as { filename?: string; data?: string }
    if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    const ext = path.extname(filename || '') || '.png'
    const name = `${Date.now()}${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    // data may be dataURL or raw base64
    const base64 = data.startsWith('data:') ? data.split(',')[1] : data
    const buffer = Buffer.from(base64, 'base64')
    const filePath = path.join(uploadsDir, name)
    await fs.writeFile(filePath, buffer)
    const url = `/uploads/${name}`
    return NextResponse.json({ url })
  } catch (e: any) {
    console.error('Upload error', e)
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}




