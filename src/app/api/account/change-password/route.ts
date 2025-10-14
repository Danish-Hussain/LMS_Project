import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body || {}
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirm password do not match' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

  const user = await verifyToken(token as string)
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const match = await verifyPassword(currentPassword, dbUser.password)
    if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })

    const newHash = await hashPassword(newPassword)

    // Use typed Prisma update to set new password and increment tokenVersion
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: newHash, tokenVersion: { increment: 1 } } })

    // Send confirmation email if SMTP configured
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const userSmtp = process.env.SMTP_USER
    const passSmtp = process.env.SMTP_PASS
    const receiver = updated.email

    if (host && port && userSmtp && passSmtp) {
      try {
        const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: userSmtp, pass: passSmtp } })
        await transporter.sendMail({
          from: userSmtp,
          to: receiver,
          subject: 'Your password has been changed',
          text: `Hello ${updated.name},\n\nThis is a confirmation that your account password was changed. If you did not perform this action, please contact support immediately.`,
        })
      } catch (mailErr) {
        console.error('Failed to send confirmation email', mailErr)
      }
    } else {
      console.log('SMTP not configured; skipping confirmation email')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Change password error', err)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
