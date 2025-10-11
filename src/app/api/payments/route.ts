import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    const user = verifyToken(token)

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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId,
        enrollmentId: '', // enrollmentId will be set after creating enrollment
        amount,
        status: 'COMPLETED', // Simulate successful payment
        method: paymentMethod
      }
    })

    // Create enrollment record
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        batchId: batchId || '',
        status: 'APPROVED'
      }
    })

    // link payment to enrollment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { enrollmentId: enrollment.id }
    })

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

    const user = verifyToken(token)

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
