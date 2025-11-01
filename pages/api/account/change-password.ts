import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {}
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: 'Missing fields' })
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New password and confirm password do not match' })

    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    const user = await verifyToken(token).catch(() => null) as any
    if (!user || !user.id) return res.status(401).json({ error: 'Invalid token' })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return res.status(404).json({ error: 'User not found' })

    const match = await verifyPassword(currentPassword, dbUser.password)
    if (!match) return res.status(403).json({ error: 'Current password is incorrect' })

    const newHash = await hashPassword(newPassword)
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: newHash, tokenVersion: { increment: 1 } } })

    // Optional: send email if SMTP configured
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const userSmtp = process.env.SMTP_USER
    const passSmtp = process.env.SMTP_PASS
    if (host && port && userSmtp && passSmtp) {
      try {
        const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: userSmtp, pass: passSmtp } })
        await transporter.sendMail({ from: userSmtp, to: updated.email, subject: 'Your password has been changed', text: `Hello ${updated.name},\n\nThis is a confirmation that your account password was changed.` })
      } catch (err) {
        console.error('Failed to send confirmation email', err)
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Pages API change-password error', err)
    return res.status(500).json({ error: 'Failed to change password' })
  }
}
