// Legacy helper module kept for reference. It does not export route handlers so
// Next.js will not treat this file as an app route. If you want to restore a
// route handler here, move or rename the file to `route.ts` and ensure no other
// conflicting `route.*` files exist under the same directory.

import React from 'react'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { EmailVerification } from '../../../emails/auth/EmailVerification'
import { PasswordResetEmail } from '../../../emails/auth/PasswordResetEmail'
import { WelcomeEmail } from '../../../emails/auth/WelcomeEmail'

import { CourseEnrollmentEmail } from '../../../emails/course/CourseEnrollmentEmail'
import { CourseCompletionEmail } from '../../../emails/course/CourseCompletionEmail'
import { NewLessonEmail } from '../../../emails/course/NewLessonEmail'

type TemplateName =
  | 'emailVerification'
  | 'passwordReset'
  | 'welcome'
  | 'courseEnrollment'
  | 'courseCompletion'
  | 'newLesson'

const TEMPLATE_MAP: Record<TemplateName, any> = {
  emailVerification: EmailVerification,
  passwordReset: PasswordResetEmail,
  welcome: WelcomeEmail,
  courseEnrollment: CourseEnrollmentEmail,
  courseCompletion: CourseCompletionEmail,
  newLesson: NewLessonEmail,
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { template, to, subject, data, from } = body as {
      template?: TemplateName
      to?: string | string[]
      subject?: string
      data?: Record<string, any>
      from?: string
    }

    if (!template || !TEMPLATE_MAP[template]) {
      return NextResponse.json({ error: 'Invalid or missing template' }, { status: 400 })
    }
    if (!to) return NextResponse.json({ error: 'Missing `to` address' }, { status: 400 })

    const Template = TEMPLATE_MAP[template]

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not configured; skipping email send for app/api/send. Set RESEND_API_KEY in your environment (Netlify env vars).')
      return NextResponse.json({ error: 'Mail provider not configured' }, { status: 503 })
    }

    const resend = new Resend(resendApiKey)

    const res = await resend.emails.send({
      from: from || `no-reply@${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'example.com'}`,
      to: Array.isArray(to) ? to : [to],
      subject: subject || (data?.subject ?? 'Notification'),
      react: React.createElement(Template, { ...(data || {}) }),
    })

    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
