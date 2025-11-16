# LMS (Learning Management System)

A modern Learning Management System built with Next.js, featuring video content delivery, progress tracking, and course management.

## Features

- 🎥 Video content delivery with Vimeo integration
- 👥 User authentication and authorization
- 📊 Progress tracking
- 📚 Course and batch management
- 📝 Session and section organization
- 💳 Payment integration
- 📱 Responsive design

## Tech Stack

- **Framework:** Next.js 15.5
- **Language:** TypeScript
- **Database:** Prisma with SQLite
- **Authentication:** JWT with bcrypt
- **UI Components:** Tailwind CSS
- **Video Player:** Vimeo Player
- **State Management:** React Context


## Functionality

### Updating database for Instructor fields

The Instructors management feature adds three optional fields to the `User` model:

- specialization: String?
- bio: String?
- profileImage: String?

Run a migration after pulling these changes:

1. Apply migration:
	- Development:
	  - npx prisma migrate dev --name add_instructor_profile_fields
	- Production (or CI): create a SQL migration that adds these columns.
2. Regenerate the Prisma client if needed:
	- npx prisma generate

Notes:
- Until `prisma generate` runs, the API uses minimal `any` casts around these new fields to avoid type errors. These casts are safe to keep; they can be removed after generation.