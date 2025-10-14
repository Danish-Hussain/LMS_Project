const { PrismaClient, Role } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN
    }
  })
  console.log('Admin user created:', admin)

  // Create instructor user
  const instructorPassword = await bcrypt.hash('instructor123', 10)
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {},
    create: {
      email: 'instructor@example.com',
      name: 'Instructor User',
      password: instructorPassword,
      role: Role.INSTRUCTOR
    }
  })
  console.log('Instructor user created:', instructor)

  // Create a sample course
  const course = await prisma.course.upsert({
    where: { id: 'sample-course' },
    update: {},
    create: {
      id: 'sample-course',
      title: 'Sample Course',
      description: 'This is a sample course for testing',
      isPublished: true,
      creatorId: instructor.id
    }
  })
  console.log('Sample course created:', course)

  // Create a sample batch
  const batch = await prisma.batch.upsert({
    where: { id: 'sample-batch' },
    update: {},
    create: {
      id: 'sample-batch',
      name: 'Sample Batch',
      courseId: course.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  })
  console.log('Sample batch created:', batch)

  // Create a sample section
  const section = await prisma.courseSection.upsert({
    where: { id: 'sample-section' },
    update: {},
    create: {
      id: 'sample-section',
      title: 'Introduction',
      description: 'Introduction to the course',
      order: 1,
      courseId: course.id,
      batchId: batch.id
    }
  })
  console.log('Sample section created:', section)

  // Create sample sessions
  const session1 = await prisma.session.upsert({
    where: { id: 'sample-session-1' },
    update: {},
    create: {
      id: 'sample-session-1',
      title: 'Getting Started',
      videoUrl: 'https://example.com/video1.mp4',
      order: 1,
      isPublished: true,
      courseId: course.id,
      batchId: batch.id,
      sectionId: section.id
    }
  })
  console.log('Sample session 1 created:', session1)

  const session2 = await prisma.session.upsert({
    where: { id: 'sample-session-2' },
    update: {},
    create: {
      id: 'sample-session-2',
      title: 'Basic Concepts',
      videoUrl: 'https://example.com/video2.mp4',
      order: 2,
      isPublished: true,
      courseId: course.id,
      batchId: batch.id,
      sectionId: section.id
    }
  })
  console.log('Sample session 2 created:', session2)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })