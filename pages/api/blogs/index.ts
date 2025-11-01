import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { verifyToken } from '@/lib/auth'

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
    if (req.method === 'GET') {
      const blogs = await readBlogs()
      return res.status(200).json(blogs)
    }

    if (req.method === 'POST') {
      const token = req.cookies['auth-token']
      const authUser = token ? await verifyToken(token) : null
      if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'INSTRUCTOR')) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const body = req.body || {}
      if (!body.title) return res.status(400).json({ error: 'Missing title' })
      const blogs = await readBlogs()
      const newBlog = {
        id: Date.now().toString(),
        title: String(body.title),
        topic: body.topic ?? '',
        coverImage: body.coverImage ?? '',
        content: body.content ?? null,
        published: !!body.published,
        createdAt: new Date().toISOString(),
      }
      blogs.unshift(newBlog)
      await writeBlogs(blogs)
      return res.status(201).json(newBlog)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('Blogs API (pages) error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
