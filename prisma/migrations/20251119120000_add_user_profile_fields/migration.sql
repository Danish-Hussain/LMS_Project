-- Add missing user profile/contact columns to align with Prisma schema
BEGIN;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phoneNumber" text,
  ADD COLUMN IF NOT EXISTS "specialization" text,
  ADD COLUMN IF NOT EXISTS "bio" text,
  ADD COLUMN IF NOT EXISTS "profileImage" text,
  ADD COLUMN IF NOT EXISTS "canCreateBlogs" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canCreateCourses" boolean NOT NULL DEFAULT false;

-- Unique index for nullable phoneNumber (Postgres allows multiple NULLs)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_phoneNumber_key'
  ) THEN
    CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");
  END IF;
END $$;

COMMIT;
