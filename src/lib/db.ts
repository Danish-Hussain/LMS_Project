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

// Expose a small helper to check DB connectivity without throwing at import time.
export async function checkDb(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Use a minimal raw query to avoid touching application models.
    // $queryRaw is safe here because we don't interpolate user input.
    // Prisma returns different shapes for different connectors; we only care if it succeeds.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type narrowing for different Prisma return shapes
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (err: unknown) {
    try {
      const e: any = err
      const msg = e?.message ? String(e.message) : String(err)
      // Keep logs minimal and avoid leaking connection strings / secrets
      console.error('DB health check failed:', { message: msg, code: e?.code })
      return { ok: false, error: msg }
    } catch (logErr) {
      console.error('DB health check failed (logging error)', logErr)
      return { ok: false, error: 'unknown' }
    }
  }
}

// Catch uncaught exceptions so the runtime logs contain clearer information
process.on('uncaughtException', (err) => {
  try {
    if (err && typeof err === 'object') {
      const e: any = err
      console.error('Uncaught exception (db):', { name: e.name, message: e.message, code: e.code })
    } else {
      console.error('Uncaught exception (db):', err)
    }
  } catch (logErr) {
    console.error('Error while logging uncaughtException:', logErr)
  }
})

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
