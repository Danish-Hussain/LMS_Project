import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ error: 'Missing token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    if (!decoded || decoded.action !== 'verify-email' || !decoded.userId) {
      return res.status(400).json({ error: 'Invalid token' })
    }

    // Mark user as verified
    // Some generated Prisma client types may be out-of-sync in the editor/CI;
    // cast the `data` to `any` to avoid a TS error while still performing the update.
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: ({ emailVerified: true } as any)
    })

    // Generate auth cookies and set them so user is signed-in after verification
    const accessToken = generateAccessToken({ id: user.id, email: user.email, name: user.name, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, name: user.name, role: user.role }, user.tokenVersion)
    const isProd = process.env.NODE_ENV === 'production'
    const accessCookie = `auth-token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${15 * 60}; ${isProd ? 'Secure; ' : ''}`
    const refreshCookie = `refresh-token=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${isProd ? 'Secure; ' : ''}`
    res.setHeader('Set-Cookie', [accessCookie, refreshCookie])

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('Email verification error:', err)
    return res.status(400).json({ error: err?.message || 'Invalid token' })
  }
}
