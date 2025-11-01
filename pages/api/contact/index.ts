import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { name, email, message } = req.body || {}
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const receiver = process.env.CONTACT_RECEIVER

    if (!host || !port || !user || !pass || !receiver) {
      console.error('Missing SMTP configuration')
      return res.status(500).json({ error: 'Email server not configured' })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const info = await transporter.sendMail({
      from: `${name} <${email}>`,
      to: receiver,
      subject: `Website contact form: ${name}`,
      text: message,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message}</p>`,
    })

    console.log('Message sent (pages api): %s', info.messageId)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Contact send error (pages api):', err)
    return res.status(500).json({ error: 'Failed to send' })
  }
}
