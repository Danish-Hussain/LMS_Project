import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Payment successful</h1>
        <p className="mb-6">Thank you for your purchase. Your enrollment is active.</p>
        <Link href="/" className="text-white bg-blue-600 px-4 py-2 rounded">Go to dashboard</Link>
      </div>
    </div>
  )
}
