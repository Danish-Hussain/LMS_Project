import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const isProd = process.env.NODE_ENV === 'production'
    // Expire cookie immediately
    res.setHeader('Set-Cookie', `auth-token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; ${isProd ? 'Secure; ' : ''}`)
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Pages API logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
