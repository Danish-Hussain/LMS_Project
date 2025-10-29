import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

  const { courseId, batchId, amount, paymentMethod, cardDetails } = await request.json()

    if (!courseId || !batchId || amount === undefined) {
      return NextResponse.json(
        { error: 'Course ID, batch ID, and amount are required' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll simulate a successful payment
    // In a real application, you would integrate with a payment gateway like Stripe, PayPal, etc.
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Use a transaction to create enrollment and payment atomically.
    const amountInPaise = typeof amount === 'number' && !Number.isInteger(amount) ? Math.round(amount * 100) : Math.round(Number(amount) || 0)

    let enrollment
    let payment
    try {
      const result = await prisma.$transaction(async (tx) => {
        const en = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId,
            batchId: batchId || undefined,
            status: 'APPROVED'
          }
        })

        const pay = await tx.payment.create({
          data: ({
            userId: user.id,
            courseId,
            enrollmentId: en.id,
            amount: amountInPaise,
            currency: 'INR',
            // leave status to default (PENDING) to avoid enum/convert issues during transaction
            provider: paymentMethod || 'UNKNOWN',
            orderId: transactionId,
            paymentId: transactionId
          } as Prisma.PaymentUncheckedCreateInput)
        })

        return { enrollment: en, payment: pay }
      })

      enrollment = result.enrollment
      payment = result.payment
    } catch (txError) {
      console.error('Transaction failed creating enrollment/payment:', txError)
      return NextResponse.json({ error: 'Failed to complete payment. Please try again.' }, { status: 500 })
    }

    // Attempt to mark payment completed (outside transaction). If this fails, log but continue.
    try {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } })
    } catch (updateErr) {
      console.warn('Failed to update payment status to COMPLETED:', updateErr)
    }

    return NextResponse.json({
      payment,
      enrollment,
      message: 'Payment completed successfully'
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

  const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id
      },
      include: {
        course: {
          select: { title: true }
        },
        enrollment: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
