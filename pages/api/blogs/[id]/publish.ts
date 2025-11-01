import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'blogs.json')

async function readBlogs() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err: any) {
    if (err && err.code === 'ENOENT') return []
    throw err
  }
}

async function writeBlogs(blogs: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
  await fs.writeFile(DATA_PATH, JSON.stringify(blogs, null, 2), 'utf-8')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { id } = req.query
    const { publish } = req.body || {}
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' })

    const blogs = await readBlogs()
    const idx = blogs.findIndex((b: any) => String(b.id) === id)
    if (idx === -1) return res.status(404).json({ error: 'Not found' })

    const updated = { ...blogs[idx], isPublished: !!publish, published: !!publish }
    blogs[idx] = updated
    await writeBlogs(blogs)

    return res.status(200).json(updated)
  } catch (err) {
    console.error('Blogs publish API (pages) error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
