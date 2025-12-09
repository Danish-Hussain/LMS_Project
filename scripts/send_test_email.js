const { Resend } = require('resend')

async function main() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const to = process.argv[2] || 'shaikdanishhussain105@gmail.com'
    console.log('Sending test email to', to)
    const result = await resend.emails.send({
    from: 'SAPIntegrationExpert <onboarding@resend.dev>',
      to,
      subject: 'Test email from LMS_Project',
      html: `<p>This is a test email sent from your local development environment.</p>`
    })
    console.log('Send result:', result)
  } catch (err) {
    console.error('Failed to send test email:', err)
  }
}

main()
