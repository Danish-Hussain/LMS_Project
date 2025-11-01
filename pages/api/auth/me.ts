import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ error: 'Not authenticated' })

    const user = await verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    return res.status(200).json({ user })
  } catch (error) {
    console.error('Pages API me error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
