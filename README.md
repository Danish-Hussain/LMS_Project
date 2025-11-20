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

## Deployment — Postgres on Netlify (recommended)

If you plan to deploy this site to Netlify, we recommend using a managed Postgres database in production instead of a checked-in SQLite file. Below are minimal, pragmatic steps to get the app building on Netlify and running against Postgres.

1) Provision a Postgres database
	- Options: Neon, Supabase, Render, AWS RDS, DigitalOcean Managed, etc.
	- Note the full connection string (DATABASE_URL) — example:
		postgres://username:password@db-host.example.com:5432/database_name

2) Set the `DATABASE_URL` environment variable in Netlify
	- Go to your site -> Site settings -> Build & deploy -> Environment -> Environment variables
	- Add a variable named `DATABASE_URL` with the full Postgres connection string

3) Local verification (recommended before pushing)
	- Export the DATABASE_URL locally so commands below use the same DB as Netlify:
```bash
export DATABASE_URL="postgres://username:password@db-host.example.com:5432/database_name"
```
	- Generate the Prisma client:
```bash
npx prisma generate
```
	- Create and apply a development migration (this creates migration SQL files under `prisma/migrations`):
```bash
npx prisma migrate dev --name init
```
	- Run the Next.js production build to verify everything compiles:
```bash
npm run build
```

4) Netlify build behavior
	- `netlify.toml` has a build command that will run `npx prisma generate` and `npx prisma migrate deploy` before `next build`. That ensures the Prisma Client exists and migrations are applied during the build.
	- If your DB requires additional setup (IP allowlist, SSL config, connection pooling), make sure Netlify can reach the DB from its build/runtime environment.

5) Data migration (SQLite -> Postgres)
	- If you have existing data in SQLite and need it in Postgres, you must migrate it (dump & import or write a small migration script). Prisma does not automatically move data between providers.

Notes & tips
	- Connection pooling: avoid opening many direct DB connections from serverless functions; prefer a pool/proxy when required (Neon provides serverless-friendly connection handling). Check your Postgres provider docs.
	- Secrets: keep `DATABASE_URL` private and rotate credentials if you suspect leakage.
	- If you need me to add a small `./scripts` helper to bootstrap a Postgres dev DB or produce an `.env.example` file, say so and I will add it.