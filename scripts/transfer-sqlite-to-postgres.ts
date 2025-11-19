/*
 * One-time data transfer from existing SQLite dev DB to Postgres (Neon).
 * Usage:
 *  1. Set DATABASE_URL to Postgres and SQLITE_DATABASE_URL to old file path.
 *  2. Run: ts-node scripts/transfer-sqlite-to-postgres.ts
 *  3. Verify counts; then remove dev.db if desired.
 *
 * Safety:
 *  - Does NOT delete source data.
 *  - Skips records if target already has an entry with the same primary key.
 *  - Assumes identical Prisma schema (now provider = postgresql).
 */

import { PrismaClient } from '@prisma/client'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var ${name}`)
  return v
}

// Source (SQLite) and Target (Postgres) clients
const source = new PrismaClient({ datasources: { db: { url: required('SQLITE_DATABASE_URL') } } })
const target = new PrismaClient({ datasources: { db: { url: required('DATABASE_URL') } } })

async function main() {
  console.log('--- Starting transfer from SQLite to Postgres ---')

  // Order matters due to foreign keys
  await copy('user', () => source.user.findMany(), async (r) => target.user.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('course', () => source.course.findMany(), async (r) => target.course.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('recordedCourse', () => source.recordedCourse.findMany(), async (r) => target.recordedCourse.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('batch', () => source.batch.findMany(), async (r) => target.batch.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('courseSection', () => source.courseSection.findMany(), async (r) => target.courseSection.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('session', () => source.session.findMany(), async (r) => target.session.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('enrollment', () => source.enrollment.findMany(), async (r) => target.enrollment.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('progress', () => source.progress.findMany(), async (r) => target.progress.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('payment', () => source.payment.findMany(), async (r) => target.payment.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  await copy('recordedCourseEnrollment', () => source.recordedCourseEnrollment.findMany(), async (r) => target.recordedCourseEnrollment.upsert({
    where: { id: r.id },
    update: {},
    create: r,
  }))

  console.log('--- Transfer complete ---')
}

async function copy<T>(label: string, fetch: () => Promise<T[]>, upsert: (row: any) => Promise<any>) {
  const rows = await fetch()
  console.log(`[${label}] transferring ${rows.length} rows`) 
  let ok = 0
  for (const row of rows) {
    await upsert(row)
    ok++
  }
  console.log(`[${label}] done (${ok})`)
}

main().catch((e) => {
  console.error('Transfer failed:', e)
  process.exit(1)
}).finally(async () => {
  await source.$disconnect()
  await target.$disconnect()
})
