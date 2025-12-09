import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { email, code } = req.body || {}
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' })
    // Find pending registration and validate OTP
  const pending = await (prisma as any).pendingUser.findUnique({ where: { email } })
    if (!pending) return res.status(400).json({ error: 'Invalid email or code' })
    const p: any = pending
    if (!p.otp || !p.otpExpires) return res.status(400).json({ error: 'No code exists for this pending registration' })
    const now = new Date()
    if (p.otp !== String(code)) return res.status(400).json({ error: 'Invalid code' })
    if (new Date(p.otpExpires) < now) return res.status(400).json({ error: 'Code expired' })

    // Create actual user from pending record
    // Create user from pending record. Some Prisma client/type setups may not
    // accept `emailVerified` in the create input in older generated types, so
    // create the user first with the canonical fields and then mark verified.
    const created = await prisma.user.create({ data: {
      email: pending.email,
      name: pending.name,
      password: pending.password,
      role: pending.role as any,
      phoneNumber: pending.phoneNumber
    } })

    // Mark emailVerified explicitly after creation (safe regardless of client types)
    try {
      await prisma.user.update({ where: { id: created.id }, data: { emailVerified: true } as any })
    } catch (e) {
      // Best-effort: if update fails due to types or schema drift, continue.
      console.warn('Failed to set emailVerified on user update:', e)
    }

    // Remove pending registration
  await (prisma as any).pendingUser.delete({ where: { id: pending.id } })

    const updated = created

    // Generate tokens and set cookies
    const accessToken = generateAccessToken({ id: updated.id, email: updated.email, name: updated.name, role: updated.role })
    const refreshToken = generateRefreshToken({ id: updated.id, email: updated.email, name: updated.name, role: updated.role }, updated.tokenVersion)
    const isProd = process.env.NODE_ENV === 'production'
    const accessCookie = `auth-token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${15 * 60}; ${isProd ? 'Secure; ' : ''}`
    const refreshCookie = `refresh-token=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; ${isProd ? 'Secure; ' : ''}`
    res.setHeader('Set-Cookie', [accessCookie, refreshCookie])

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('Verify-OTP error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
