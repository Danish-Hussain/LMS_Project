-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpFirstRequestAt" TIMESTAMP(3),
ADD COLUMN     "otpLastRequestedAt" TIMESTAMP(3),
ADD COLUMN     "otpRequestCount" INTEGER NOT NULL DEFAULT 0;
