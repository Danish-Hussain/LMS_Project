import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])

function listImages(dir: string, basePublicPath: string): { path: string, size: number, mtime: number }[] {
  const results: { path: string, size: number, mtime: number }[] = []
  if (!fs.existsSync(dir)) return results

  const walk = (d: string) => {
    const entries = fs.readdirSync(d, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) {
        walk(full)
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase()
        if (IMAGE_EXTS.has(ext)) {
          const st = fs.statSync(full)
          const publicPath = '/' + path.join(basePublicPath, path.relative(dir, full)).split(path.sep).join('/')
          results.push({ path: publicPath, size: st.size, mtime: st.mtimeMs })
        }
      }
    }
  }

  walk(dir)
  return results
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || !['ADMIN', 'INSTRUCTOR'].includes((user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const root = process.cwd()
    const uploadsDir = path.join(root, 'public', 'uploads')
    const coursesDir = path.join(root, 'public', 'courses')

    const uploads = listImages(uploadsDir, 'uploads')
    const courses = listImages(coursesDir, 'courses')
    const images = [...uploads, ...courses].sort((a, b) => b.mtime - a.mtime)

    return NextResponse.json({ images })
  } catch (e) {
    console.error('public-images error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
