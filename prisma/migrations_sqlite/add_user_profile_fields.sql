-- SQLite migration to add missing User profile columns
-- Run via: sqlite3 prisma/dev.db < prisma/migrations_sqlite/add_user_profile_fields.sql

BEGIN TRANSACTION;

-- Add new columns if they don't exist (SQLite doesn't have IF NOT EXISTS for columns, so we'll check manually)
-- If the column already exists, SQLite will error but the transaction will rollback safely.

ALTER TABLE users ADD COLUMN phoneNumber TEXT;
ALTER TABLE users ADD COLUMN specialization TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profileImage TEXT;
ALTER TABLE users ADD COLUMN canCreateBlogs INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN canCreateCourses INTEGER NOT NULL DEFAULT 0;

-- Create unique index on phoneNumber (SQLite allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS users_phoneNumber_key ON users(phoneNumber);

COMMIT;
