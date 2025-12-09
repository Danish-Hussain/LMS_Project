const { Resend } = require('resend')

async function main() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const res = await resend.domains.list()
    console.log('Domains response:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error listing domains:', err)
    process.exit(1)
  }
}

main()
