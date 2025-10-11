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
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })