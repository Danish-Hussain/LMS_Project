import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  try {
    const { name } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Name required' })

    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const authUser = await verifyToken(token).catch(() => null) as any
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' })

    const updated = await prisma.user.update({ where: { id: authUser.id }, data: { name } })
    return res.status(200).json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
  } catch (err) {
    console.error('Pages API account/update error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
