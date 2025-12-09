const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const pendings = await prisma.pendingUser.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
    if (!pendings || pendings.length === 0) {
      console.log('No pending users found.')
      return
    }
    console.log('Recent pending users:')
    for (const p of pendings) {
      console.log(`- id: ${p.id}`)
      console.log(`  email: ${p.email}`)
      console.log(`  name: ${p.name}`)
      console.log(`  otp: ${p.otp}`)
      console.log(`  otpExpires: ${p.otpExpires}`)
      console.log(`  otpRequestCount: ${p.otpRequestCount}`)
      console.log(`  createdAt: ${p.createdAt}`)
    }
  } catch (err) {
    console.error('Error listing pending users:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
