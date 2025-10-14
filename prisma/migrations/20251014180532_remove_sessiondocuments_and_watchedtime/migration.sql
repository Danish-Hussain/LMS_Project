/*
  Warnings:

  - You are about to drop the `session_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `watchedTime` on the `progress` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "session_documents";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_progress" ("completed", "createdAt", "id", "sessionId", "updatedAt", "userId") SELECT "completed", "createdAt", "id", "sessionId", "updatedAt", "userId" FROM "progress";
DROP TABLE "progress";
ALTER TABLE "new_progress" RENAME TO "progress";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
