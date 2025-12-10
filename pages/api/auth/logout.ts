import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const isProd = process.env.NODE_ENV === 'production'
  // Expire cookies immediately. Include an explicit past Expires date to
  // improve compatibility with some browsers/clients that don't honor
  // Max-Age=0 in all contexts.
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const accessClear = `auth-token=; HttpOnly; Path=/; SameSite=Lax; Expires=${expires}; Max-Age=0; ${isProd ? 'Secure; ' : ''}`
  const refreshClear = `refresh-token=; HttpOnly; Path=/; SameSite=Lax; Expires=${expires}; Max-Age=0; ${isProd ? 'Secure; ' : ''}`
    res.setHeader('Set-Cookie', [accessClear, refreshClear])

    // Try to invalidate refresh tokens server-side by bumping tokenVersion
    try {
      const token = req.cookies['refresh-token'] || req.cookies['auth-token']
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        if (decoded?.userId) {
          await prisma.user.update({ where: { id: decoded.userId }, data: { tokenVersion: { increment: 1 } } })
        }
      }
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Pages API logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
