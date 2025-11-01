import type { NextApiRequest, NextApiResponse } from 'next'
import { createUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { email, password, name, role } = req.body || {}

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'] as const
    const userRole = validRoles.includes(role) ? role : 'STUDENT'

    const user = await createUser(email, password, name, userRole)
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const token = generateToken(user, dbUser?.tokenVersion)

    const isProd = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${isProd ? 'Secure; ' : ''}`)

    return res.status(200).json({ user })
  } catch (error: any) {
    try {
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'Email already exists' })
      }
    } catch {}
    console.error('Pages API register error:', error)
    return res.status(500).json({ error: error?.message || 'Internal server error' })
  }
}
