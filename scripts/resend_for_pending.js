const { PrismaClient } = require('@prisma/client')
const { Resend } = require('resend')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node resend_for_pending.js <pending-email> [send-to-override]')
    process.exit(1)
  }

  const sendToOverride = process.argv[3] // optional override recipient (e.g., Resend test address)

  try {
    const pending = await prisma.pendingUser.findUnique({ where: { email } })
    if (!pending) {
      console.error('Pending user not found for email:', email)
      return
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const updated = await prisma.pendingUser.update({ where: { id: pending.id }, data: {
      otp,
      otpExpires: expiresAt,
      otpRequestCount: (pending.otpRequestCount || 0) + 1,
      otpFirstRequestAt: pending.otpFirstRequestAt || new Date(),
      otpLastRequestedAt: new Date()
    } })

    console.log('Updated pending user with new OTP:', { email: updated.email, otp: updated.otp, otpExpires: updated.otpExpires })

    // Send via Resend. If account is in testing mode, you can pass a sendToOverride
    const resend = new Resend(process.env.RESEND_API_KEY)
    const to = sendToOverride || updated.email
  const from = process.env.RESEND_FROM || 'SAPIntegrationExpert <onboarding@resend.dev>'

    const bodyHtml = `<p>OTP for pending user ${updated.email}: <strong>${otp}</strong></p><p>Expires at: ${expiresAt.toISOString()}</p>`

    const result = await resend.emails.send({ from, to, subject: `Verification code for ${updated.email}`, html: bodyHtml })
    console.log('Send result:', result)

  } catch (err) {
    console.error('Error in resend_for_pending:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
