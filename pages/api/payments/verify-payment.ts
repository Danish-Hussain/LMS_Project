import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    let user
    try {
      user = await verifyToken(token)
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, batchId } = req.body
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) return res.status(400).json({ error: 'Missing parameters' })

    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    if (!secret) {
      console.error('Razorpay secret missing in server environment: RAZORPAY_KEY_SECRET')
      return res.status(500).json({ error: 'Payment processor not configured' })
    }
    const generated_signature = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')

    if (generated_signature !== razorpay_signature) {
      console.warn('Razorpay signature mismatch', { generated_signature, razorpay_signature })
      // Attempt to mark any payment with this orderId as FAILED (best-effort)
      await prisma.payment.updateMany({ where: ({ orderId: razorpay_order_id } as any), data: { status: 'FAILED' } })
      return res.status(400).json({ error: 'Invalid signature' })
    }

  // Attempt to find an existing PENDING payment created during order creation
  // Use a permissive cast here because the generated `PaymentWhereInput` types can be
  // strict about filter shapes; we're matching by the scalar `orderId` column.
  const existingPayment = await prisma.payment.findFirst({ where: { orderId: razorpay_order_id } as any })

    // Create enrollment (mark user as enrolled)
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user!.id,
        courseId,
        batchId: batchId || undefined,
        status: 'APPROVED'
      }
    })

    // Determine amount from course price (store as integer paise)
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { price: true } })
    const amountInPaise = Math.round((course?.price || 0) * 100)

    if (existingPayment) {
      // Update the pending payment record
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: ({
          paymentId: razorpay_payment_id,
          status: 'COMPLETED',
          enrollmentId: enrollment.id,
          amount: amountInPaise
        } as Prisma.PaymentUncheckedUpdateInput)
      })
    } else {
      // Fallback: create a payment record if none exists
      await prisma.payment.create({ data: ({
        userId: user!.id,
        courseId,
        enrollmentId: enrollment.id,
        provider: 'Razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: amountInPaise,
        currency: 'INR',
        status: 'COMPLETED'
      } as Prisma.PaymentUncheckedCreateInput) })
    }

    return res.json({ success: true, enrollmentId: enrollment.id })
  } catch (error) {
    console.error('verify-payment error', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
