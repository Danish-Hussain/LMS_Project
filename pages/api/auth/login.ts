import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await authenticateUser(email, password)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const token = generateToken(user, dbUser?.tokenVersion)

    const isProd = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${isProd ? 'Secure; ' : ''}`)

    return res.status(200).json({ user })
  } catch (error) {
    console.error('Pages API login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
