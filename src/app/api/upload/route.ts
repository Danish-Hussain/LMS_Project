import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const { filename, contentBase64 } = await request.json()
    if (!filename || !contentBase64) {
      return NextResponse.json({ error: 'filename and contentBase64 are required' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(uploadsDir, safeName)

    const buffer = Buffer.from(contentBase64, 'base64')
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${safeName}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



