-- Migration: add Razorpay payment fields to payments table
BEGIN;

-- Add columns for Razorpay integration (keep existing columns to be safe)
ALTER TABLE IF EXISTS "payments"
  ADD COLUMN IF NOT EXISTS "provider" text NOT NULL DEFAULT 'Razorpay',
  ADD COLUMN IF NOT EXISTS "orderId" text,
  ADD COLUMN IF NOT EXISTS "paymentId" text,
  ADD COLUMN IF NOT EXISTS "amount" bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now();

COMMIT;
