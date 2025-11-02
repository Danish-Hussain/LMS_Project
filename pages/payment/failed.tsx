import Link from 'next/link'
import { useRouter } from 'next/router'

function useQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const sp = new URLSearchParams(window.location.search)
    return sp.get(key)
  } catch {
    return null
  }
}

export default function FailedPage() {
  const router = useRouter()
  const code = useQueryParam('code')
  const human = code ? decodeURIComponent(code) : null
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Payment failed</h1>
        <p className="mb-2">There was a problem processing your payment. Please try again.</p>
        {human && (
          <p className="mb-6 text-sm text-gray-500 break-all">Reason: {human}</p>
        )}
        <Link href="/courses" className="text-white bg-blue-600 px-4 py-2 rounded">Back to courses</Link>
      </div>
    </div>
  )
}
