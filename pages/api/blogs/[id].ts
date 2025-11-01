import type { NextApiRequest, NextApiResponse } from 'next'
import { getBlogById, updateBlog } from '@/lib/blogStorage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const blog = await getBlogById(id)
    if (!blog) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(blog)
  }

  if (req.method === 'PUT') {
    try {
      const updated = await updateBlog(id, req.body)
      if (!updated) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(updated)
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || 'Invalid body' })
    }
  }

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
