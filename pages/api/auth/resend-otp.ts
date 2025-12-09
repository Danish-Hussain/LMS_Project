import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'

// Limits
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_PER_WINDOW = 5
const MIN_SECONDS_BETWEEN = 60 // 1 minute between resends

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })

  // Operate on PendingUser (we don't resend to already-created users)
  const pending = await (prisma as any).pendingUser.findUnique({ where: { email } })
  if (!pending) return res.status(404).json({ error: 'Pending registration not found' })

  const u: any = pending

    const now = new Date()

    // Reset counter if window expired
    if (!u.otpFirstRequestAt || (new Date(u.otpFirstRequestAt).getTime() + WINDOW_MS) <= now.getTime()) {
      u.otpRequestCount = 0
      u.otpFirstRequestAt = now
    }

    // Enforce minimum seconds between resends
    if (u.otpLastRequestedAt) {
      const last = new Date(u.otpLastRequestedAt)
      const secondsSince = Math.floor((now.getTime() - last.getTime()) / 1000)
      if (secondsSince < MIN_SECONDS_BETWEEN) {
        return res.status(429).json({ error: 'Too many requests', retryAfter: MIN_SECONDS_BETWEEN - secondsSince })
      }
    }

    if ((u.otpRequestCount || 0) >= MAX_PER_WINDOW) {
      const retryAfterMs = (new Date(u.otpFirstRequestAt).getTime() + WINDOW_MS) - now.getTime()
      const retryAfter = Math.ceil(retryAfterMs / 1000)
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfter })
    }

    // Generate and persist new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const updated = await (prisma as any).pendingUser.update({ where: { id: pending.id }, data: ({
      otp,
      otpExpires: expiresAt,
      otpRequestCount: (u.otpRequestCount || 0) + 1,
      otpFirstRequestAt: u.otpFirstRequestAt || now,
      otpLastRequestedAt: now
    } as any) })

    // Send email (best-effort). Dynamically import template to avoid resolution issues
    try {
      const { Resend } = await import('resend')
      // Avoid TS path alias resolution during dynamic import; use relative path
      const { default: EmailOTP } = await import('../../../emails/auth/EmailOTP')
      const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress = process.env.RESEND_FROM || 'SAPIntegrationExpert <onboarding@sapintegrationexpert.com>'
      const sendResult = await resend.emails.send({
        from: fromAddress,
        to: updated.email,
        subject: 'Your verification code',
        react: EmailOTP({ firstName: updated.name || undefined, otp, expiresAt: expiresAt.toISOString() })
      })
      console.log('Resend OTP send result:', sendResult)
      if (sendResult?.error) console.warn('Resend returned an error object while resending OTP:', sendResult.error)
    } catch (err) {
      console.error('Failed to send resend OTP email:', err)
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('Resend OTP error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
