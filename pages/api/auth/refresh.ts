import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const token = req.cookies['refresh-token']
    if (!token) return res.status(401).json({ error: 'Missing refresh token' })

    // Verify refresh token and ensure tokenVersion matches
    const user = await verifyRefreshToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid or expired refresh token' })

    // Re-read DB user to get current tokenVersion
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return res.status(401).json({ error: 'User not found' })

    // Issue new tokens (rotate refresh token)
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user, dbUser.tokenVersion)

    const isProd = process.env.NODE_ENV === 'production'
    const accessCookie = `auth-token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${15 * 60}; ${isProd ? 'Secure; ' : ''}`
    const refreshCookie = `refresh-token=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${isProd ? 'Secure; ' : ''}`
    res.setHeader('Set-Cookie', [accessCookie, refreshCookie])

    return res.status(200).json({ user })
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
