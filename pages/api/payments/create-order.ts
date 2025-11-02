import type { NextApiRequest, NextApiResponse } from 'next'
const Razorpay = require('razorpay') as any
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Verify JWT from cookies
    const token = req.cookies['auth-token']
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    let user
    try {
      user = await verifyToken(token)
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }

  const { courseId, batchId } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId is required' })

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, price: true } })
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const price = typeof course.price === 'number' ? course.price : 0
    const amount = Math.round(price * 100) // amount in paise

    const keyId = process.env.RAZORPAY_KEY_ID || ''
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
    if (!keyId || !keySecret) {
      console.error('Razorpay env missing in server: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set')
      return res.status(500).json({ error: 'Payment processor not configured' })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })

    // Build a short, unique receipt id (Razorpay limit: max 40 chars)
    const receiptParts = [
      'r',
      Date.now().toString(36),
      String(course.id).slice(0, 6),
      String(user!.id).slice(0, 6)
    ]
    if (batchId) receiptParts.push(String(batchId).slice(0, 6))
    let receipt = receiptParts.join('_')
    if (receipt.length > 40) receipt = receipt.slice(0, 40)

    const options = {
      amount,
      currency: 'INR',
      receipt,
      payment_capture: 1
    }

  const order = await razorpay.orders.create(options as any)
  // Persist a PENDING payment record server-side to prevent client tampering
  try {
    await prisma.payment.create({
      data: {
        userId: user!.id,
        courseId: course.id,
        // enrollmentId/paymentId omitted until payment is completed
        provider: 'Razorpay',
        orderId: order.id,
        amount,
        currency: 'INR',
        status: 'PENDING'
      } as any
    })
  } catch (e) {
    console.warn('Failed to create payment record for order', order.id, e)
    // Not fatal for order creation — continue
  }

  // Return order id and key to client
  return res.json({ orderId: order.id, keyId, amount })
  } catch (error) {
    console.error('create-order error', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
