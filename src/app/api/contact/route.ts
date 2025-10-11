import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

type Body = {
  name: string
  email: string
  message: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    if (!body?.name || !body?.email || !body?.message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const receiver = process.env.CONTACT_RECEIVER

    if (!host || !port || !user || !pass || !receiver) {
      console.error('Missing SMTP configuration')
      return NextResponse.json({ error: 'Email server not configured' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const info = await transporter.sendMail({
      from: `${body.name} <${body.email}>`,
      to: receiver,
      subject: `Website contact form: ${body.name}`,
      text: body.message,
      html: `<p><strong>From:</strong> ${body.name} &lt;${body.email}&gt;</p><p>${body.message}</p>`,
    })

    console.log('Message sent: %s', info.messageId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
