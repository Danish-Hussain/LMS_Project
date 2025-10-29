What to run locally to complete Razorpay integration

1. Install dependencies

   npm install

2. Ensure env variables in .env.local

   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret

3. Generate Prisma client and run migration

   # generate client types
   npx prisma generate

   # run the SQL migration we added
   npx prisma migrate deploy

   # or, for local dev with migration tracking
   npx prisma migrate dev --name add_razorpay_payment_fields

4. Run the dev server

   npm run dev

Notes:
- I added a SQL migration file under prisma/migrations/20251028_add_razorpay_payment_fields/migration.sql that adds columns to the existing payments table. Review the SQL before running.
- After running prisma generate the TypeScript Prisma client types will be updated and any `(prisma as any)` usages can be removed.
- The API routes are under pages/api/payments/create-order.ts and pages/api/payments/verify-payment.ts
- The client component is at components/payments/RazorpayButton.tsx
