import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

// Disable body parser to access raw body for signature verification
export const config = {
  api: {
    bodyParser: false
  }
}

async function getRawBody(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err) => reject(err))
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')

  try {
    const raw = await getRawBody(req)
    const signature = req.headers['x-razorpay-signature'] as string | undefined
    const secret = process.env.RAZORPAY_KEY_SECRET || ''

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
    if (!signature || expected !== signature) {
      console.warn('Webhook signature mismatch')
      return res.status(400).json({ ok: false, reason: 'invalid signature' })
    }

    const payload = JSON.parse(raw.toString('utf8'))
    const event = payload.event || ''

    // Handle payment captured / authorized events
    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity
      if (paymentEntity && paymentEntity.order_id) {
        const orderId = paymentEntity.order_id
        const status = paymentEntity.status || (event === 'payment.failed' ? 'FAILED' : 'PENDING')
        const razorpayPaymentId = paymentEntity.id

        // Update payment record if exists
        const existing = await prisma.payment.findFirst({ where: { orderId } })
        if (existing) {
          await prisma.payment.update({
            where: { id: existing.id },
            data: {
              paymentId: razorpayPaymentId,
              status: status === 'captured' || status === 'authorized' ? 'COMPLETED' : 'FAILED'
            }
          })
        } else {
          // If no existing payment record found, log and skip creating incomplete record.
          console.warn('Webhook received for unknown orderId, skipping create:', orderId)
        }
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook handler error', err)
    return res.status(500).json({ ok: false })
  }
}
