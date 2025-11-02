"use client"

import React from 'react'

type Props = {
  courseId: string
  courseTitle?: string
  amount?: number // rupees
  batchId?: string
}

async function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load script'))
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ courseId, courseTitle, amount, batchId }: Props) {
  const handleEnroll = async () => {
    try {
      const resp = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId, batchId })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to create order')

      await loadScript('https://checkout.razorpay.com/v1/checkout.js')

      const options: any = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: courseTitle || 'Course Purchase',
        description: courseTitle || 'Course enrollment',
        order_id: data.orderId,
        handler: async function (response: any) {
          // verify on server
          const verifyRes = await fetch('/api/payments/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId,
              batchId
            })
          })
          const verifyJson = await verifyRes.json()
          if (verifyRes.ok) {
            window.location.href = '/payment/success'
          } else {
            console.error('Payment verification failed', verifyJson)
            window.location.href = '/payment/failed'
          }
        },
        prefill: {},
        theme: { color: '#2563eb' }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Enrollment error', err)
      window.location.href = '/payment/failed'
    }
  }

  return (
    <button onClick={handleEnroll} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center w-full justify-center">
      Enroll{amount ? ` - ₹${amount.toLocaleString()}` : ''}
    </button>
  )
}
