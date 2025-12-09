import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function VerifyOTPPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const auth = useAuth()

  useEffect(() => {
    try {
      const pending = localStorage.getItem('pendingEmail')
      setEmail(pending)
    } catch (e) {
      setEmail(null)
    }
    // autofocus first OTP input after mount
    setTimeout(() => {
      try { inputsRef.current?.[0]?.focus() } catch (e) { /* noop */ }
    }, 50)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('No pending email found. Please register again or provide your email.')
      return
    }
    const joined = codeDigits.join('')
    if (!joined || joined.trim().length < 6) {
      setError('Please enter the 6-digit verification code')
      return
    }
    const payloadCode = joined
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: payloadCode })
      })
      const data = await res.json()
  if (res.ok && data.ok) {
        // Refresh client auth state so the user becomes signed-in immediately
        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'same-origin' })
          if (meRes.ok) {
            const meData = await meRes.json()
            // set user in auth context if available
            try { auth?.setUser?.(meData.user) } catch (e) { /* noop */ }
          }
        } catch (e) {
          // ignore and just navigate
        }
        // clear stored pending email
        try { localStorage.removeItem('pendingEmail') } catch (e) { /* noop */ }
        router.push('/dashboard')
      } else {
        setError(data?.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    if (!email) {
      setError('No pending email found to resend to')
      return
    }
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        // Start client-side cooldown
        setResendCooldown(60)
        const iv = setInterval(() => {
          setResendCooldown((prev) => {
            if (!prev || prev <= 1) {
              clearInterval(iv)
              return null
            }
            return prev - 1
          })
        }, 1000)
      } else if (res.status === 429) {
        const retryAfter = data?.retryAfter || 60
        setResendCooldown(retryAfter)
        setError(data?.error || 'Too many requests')
      } else {
        setError(data?.error || 'Failed to resend code')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  // handlers for grouped inputs
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1) // only last digit
    const next = [...codeDigits]
    next[index] = digit
    setCodeDigits(next)
    // move focus
    if (digit && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const key = e.key
    if (key === 'Backspace') {
      if (codeDigits[index]) {
        const next = [...codeDigits]
        next[index] = ''
        setCodeDigits(next)
        return
      }
      if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        const next = [...codeDigits]
        next[index - 1] = ''
        setCodeDigits(next)
      }
    } else if (key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (key === 'ArrowRight' && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('Text') || ''
    const digits = text.replace(/\D/g, '').slice(0, 6).split('')
    if (digits.length === 0) return
    const next = [...codeDigits]
    for (let i = 0; i < 6; i++) {
      next[i] = digits[i] || ''
    }
    setCodeDigits(next)
    // focus next empty or last
    const firstEmpty = next.findIndex(d => !d)
    const focusIndex = firstEmpty === -1 ? 5 : firstEmpty
    setTimeout(() => inputsRef.current[focusIndex]?.focus(), 0)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>Verify your account</h2>
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--session-subtext)' }}>
          Enter the verification code (OTP) sent to your email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-6 shadow-lg sm:rounded-xl sm:px-10 border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {email && (
              <div className="text-sm text-gray-700" style={{ color: 'var(--session-subtext)' }}>
                Verification code will be sent to <strong>{email}</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Verification code
              </label>
              <div className="flex gap-2 justify-center">
                {codeDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'var(--background)', borderColor: 'var(--section-border)', color: 'var(--foreground)' }}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="border px-4 py-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.06)', borderColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !!resendCooldown}
                className="py-3 px-4 rounded-lg text-sm font-medium border bg-transparent hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : resendCooldown ? `Resend (${resendCooldown})` : 'Resend code'}
              </button>
            </div>

            <div className="text-sm text-center" style={{ color: 'var(--session-subtext)' }}>
              <Link href="/register" className="hover:underline" style={{ color: 'var(--accent)' }}>Register a different email</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
