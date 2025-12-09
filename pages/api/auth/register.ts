import type { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import React from 'react'
import { Resend } from 'resend'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
  const { email, password, name, role, phoneNumber } = req.body || {}

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'] as const
    const userRole = validRoles.includes(role) ? role : 'STUDENT'

  const normalizedPhone = typeof phoneNumber === 'string' && phoneNumber.trim() ? normalizeE164(phoneNumber) : undefined

  // Do not create a real user until email verification completes.
  // Check for existing real user or pending registration
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'Email already exists' })
  const existingPending = await (prisma as any).pendingUser.findUnique({ where: { email } })
  if (existingPending) return res.status(409).json({ error: 'A pending verification already exists for this email' })

  // Hash the password and create a PendingUser record
  const hashed = await hashPassword(password)
  const pending = await (prisma as any).pendingUser.create({ data: {
    email,
    name,
    password: hashed,
    role: userRole,
    phoneNumber: normalizedPhone
  } })

    // Send OTP email asynchronously (best-effort)
    try {
      // Generate a 6-digit numeric OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      // Store OTP on the pending user record
  await (prisma as any).pendingUser.update({ where: { id: pending.id }, data: ({ otp, otpExpires: expiresAt, otpRequestCount: (pending.otpRequestCount || 0) + 1, otpLastRequestedAt: new Date(), otpFirstRequestAt: pending.otpFirstRequestAt || new Date() } as any) })

      const resendApiKey = process.env.RESEND_API_KEY
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY is not configured; skipping OTP email send. Set RESEND_API_KEY in your environment (Netlify env vars or .env for local).')
      } else {
        const resend = new Resend(resendApiKey)
        // Dynamically import the email template to avoid static module resolution issues
        const { default: EmailOTP } = await import('../../../emails/auth/EmailOTP')
        const fromAddress = process.env.RESEND_FROM || 'SAPIntegrationExpert <onboarding@sapintegrationexpert.com>'
        const sendResult = await resend.emails.send({
          from: fromAddress,
          to: pending.email,
          subject: 'Your verification code',
          react: React.createElement(EmailOTP, { firstName: pending.name || undefined, otp, expiresAt: expiresAt.toISOString() })
        })
        console.log('OTP email send result:', sendResult)
        if (sendResult?.error) console.warn('Resend returned an error object while sending OTP:', sendResult.error)
      }
    } catch (e) {
      console.error('Failed to send OTP email:', e)
    }

  return res.status(200).json({ message: 'User created. Verification email sent if delivery succeeded.' })
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

// Basic E.164 normalization: ensure it starts with + and contains 7-15 digits total
function normalizeE164(input: string): string | undefined {
  let v = input.trim()
  if (!v) return undefined
  if (!v.startsWith('+')) v = '+' + v
  // remove spaces, dashes, parentheses
  v = v.replace(/[\s\-()]/g, '')
  // simple validation: + followed by 7-15 digits
  if (!/^\+[0-9]{7,15}$/.test(v)) return undefined
  return v
}
