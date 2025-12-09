import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import React from 'react'
import { Resend } from 'resend'

// import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
  const { email, password, name, role, phoneNumber } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
    const userRole = role && validRoles.includes(role) ? role : 'STUDENT'

  const normalizedPhone = typeof phoneNumber === 'string' && phoneNumber.trim() ? normalizeE164(phoneNumber) : undefined

  // Do not create a real user until verified. Create PendingUser instead.
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
  const existingPending = await (prisma as any).pendingUser.findUnique({ where: { email } })
  if (existingPending) return NextResponse.json({ error: 'A pending verification already exists for this email' }, { status: 409 })

  const hashed = await hashPassword(password)
  const pending = await (prisma as any).pendingUser.create({ data: { email, name, password: hashed, role: userRole, phoneNumber: normalizedPhone } })
  // Do NOT set cookies or sign in user immediately. Require email verification first.

    // Send OTP email asynchronously
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await (prisma as any).pendingUser.update({ where: { id: pending.id }, data: ({ otp, otpExpires: expiresAt, otpRequestCount: (pending.otpRequestCount || 0) + 1, otpLastRequestedAt: new Date(), otpFirstRequestAt: pending.otpFirstRequestAt || new Date() } as any) })
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { default: EmailOTP } = await import('../../../../../emails/auth/EmailOTP')
  const fromAddress = process.env.RESEND_FROM || 'SAPIntegrationExpert <onboarding@sapintegrationexpert.com>'
      const sendResult = await resend.emails.send({
        from: fromAddress,
        to: pending.email,
        subject: 'Your verification code',
        react: React.createElement(EmailOTP, { firstName: pending.name || undefined, otp, expiresAt: expiresAt.toISOString() })
      })
      console.log('OTP email send result (app route):', sendResult)
      if (sendResult?.error) console.warn('Resend returned an error object while sending OTP (app route):', sendResult.error)
    } catch (e) {
      console.error('Failed to send OTP email (app route):', e)
    }

    return NextResponse.json({ message: 'User created. Verification email sent if delivery succeeded.' })
  } catch (error: unknown) {
    // Log detailed error information to help debugging in production logs
    try {
      const errAny = error as any
      const details = {
        message: errAny?.message,
        code: errAny?.code,
        meta: errAny?.meta,
        stack: errAny?.stack
      }
      console.error('Registration error details:', JSON.stringify(details))
    } catch (logErr) {
      console.error('Registration error (could not serialize):', error)
    }

    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Return the server error message when available to help debugging (avoid leaking sensitive info in production)
    const errAny = error as any
    const message = errAny?.message || 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
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
