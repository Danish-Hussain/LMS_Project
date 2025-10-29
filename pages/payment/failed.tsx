import Link from 'next/link'

export default function FailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Payment failed</h1>
        <p className="mb-6">There was a problem processing your payment. Please try again.</p>
        <Link href="/courses" className="text-white bg-blue-600 px-4 py-2 rounded">Back to courses</Link>
      </div>
    </div>
  )
}
