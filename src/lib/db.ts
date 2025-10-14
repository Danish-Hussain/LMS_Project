import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      'warn',
      'error',
      {
        emit: 'stdout',
        level: 'query',
      },
    ],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Error handling for database connection issues
process.on('unhandledRejection', (reason) => {
  try {
    // Log safely — `reason` can be many things; inspect minimal fields
    if (reason && typeof reason === 'object') {
      const r: any = reason
      const info: Record<string, unknown> = {
        name: r.name || 'UnknownError',
        message: r.message || String(r),
      }

      // Known Prisma fields when available
      if ('code' in r) info['code'] = r.code
      if ('meta' in r) info['meta'] = r.meta

      console.error('Unhandled rejection (db):', info)
    } else {
      console.error('Unhandled rejection (db):', reason)
    }
  } catch (logErr) {
    console.error('Error while logging unhandledRejection:', logErr)
  }
})
