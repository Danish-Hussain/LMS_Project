import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function VerifyPage() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const verify = async () => {
      setStatus('loading')
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const data = await res.json()
        if (res.ok && data.ok) {
          setStatus('success')
          setMessage('Email verified — you are now signed in.')
          // Redirect to dashboard after a short delay
          setTimeout(() => router.replace('/dashboard'), 1500)
        } else {
          setStatus('error')
          setMessage(data?.error || 'Verification failed')
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.message || 'Verification failed')
      }
    }
    verify()
  }, [token])

  return (
    <div style={{ maxWidth: 680, margin: '80px auto', padding: 24 }}>
      <h1>Verify your email</h1>
      {status === 'loading' && <p>Verifying...</p>}
      {status === 'success' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
      {status === 'idle' && <p>Waiting for verification token...</p>}
    </div>
  )
}
