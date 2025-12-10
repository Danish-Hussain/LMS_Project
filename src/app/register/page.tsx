 'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

// Password strength rules
const passwordRulesDef = [
  { key: 'length', label: 'Minimum 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'At least 1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'At least 1 lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'At least 1 number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'At least 1 special character', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(p) }
]

export function validatePassword(pwd: string) {
  if (!pwd) return false
  return passwordRulesDef.every(r => r.test(pwd))
}

function PasswordRules({ password }: { password: string }) {
  const checks = useMemo(() => passwordRulesDef.map(r => ({ ...r, ok: r.test(password || '') })), [password])
  return (
    <div className="mt-2">
      <ul className="text-xs space-y-1" aria-live="polite">
        {checks.map(c => (
          <li key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.ok ? '#047857' : '#6b7280' }}>
            <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: c.ok ? 'rgba(4,120,87,0.12)' : 'transparent', color: c.ok ? '#047857' : 'inherit', fontWeight: 700 }}>
              {c.ok ? '✓' : '•'}
            </span>
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    confirmPassword: string
    phoneCountryCode: string
    phone: string
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCountryCode: '+91',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  // success message is no longer shown here; we redirect to /verify-otp
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, phone: digits }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    // Strong password validation
    const pwd = formData.password || ''
    const pwdValid = validatePassword(pwd)
    if (!pwdValid) {
      setError('Password does not meet the required strength. Please follow the rules below.')
      return
    }

    setLoading(true)

    try {
      const phoneNumber = formData.phone ? `${formData.phoneCountryCode}${formData.phone}` : undefined
      const result = await register(
        formData.email,
        formData.password,
        formData.name,
        'STUDENT',
        phoneNumber
      )
      if (result.success) {
        if (result.message) {
          // Save pending email so verify page can resend/verify without asking for email
          try { localStorage.setItem('pendingEmail', formData.email) } catch (e) { /* ignore */ }
          // Redirect user to verify-otp where they'll enter the OTP
          router.push('/verify-otp')
        } else {
          router.push('/dashboard')
        }
      } else {
        const msg = result.message || 'Registration failed. Email might already exist.'
        // If there's already a pending verification, automatically resend the OTP
        // and navigate the user to the verify page so they can enter the code.
        if (msg.includes('pending verification')) {
          try {
            try { localStorage.setItem('pendingEmail', formData.email) } catch (e) { /* ignore */ }
            // Call resend endpoint (best-effort). If it fails, we'll still redirect to verify page
            await fetch('/api/auth/resend-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
            })
          } catch (e) {
            // ignore resend failures here; user can request resend from verify page
          }
          router.push('/verify-otp')
          return
        }

        setError(msg)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 rounded-full" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
            {/* Use the favicon SVG for the small brand avatar */}
            <Image src="/branding/favicon.svg" alt="Brand icon" width={40} height={40} priority unoptimized />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--session-subtext)' }}>
          Or{' '}
          <Link
            href="/login"
            className="font-medium hover:underline transition-all"
            style={{ color: 'var(--accent)' }}
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="border px-4 py-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {/* successMessage removed: registration now redirects to /verify-otp */}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: 'var(--section-border)', 
                  color: 'var(--foreground)' 
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: 'var(--section-border)', 
                  color: 'var(--foreground)' 
                }}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  name="phoneCountryCode"
                  value={formData.phoneCountryCode}
                  onChange={handleChange}
                  className="w-32 appearance-none block px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--section-border)', 
                    color: 'var(--foreground)'
                  }}
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+94">🇱🇰 +94</option>
                  <option value="+880">🇧🇩 +880</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+62">🇮🇩 +62</option>
                  <option value="+63">🇵🇭 +63</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+27">🇿🇦 +27</option>
                </select>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{7,15}"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="flex-1 appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--section-border)', 
                    color: 'var(--foreground)'
                  }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--session-subtext)' }}>
                Optional. We'll use this for account recovery and notifications.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--section-border)', 
                    color: 'var(--foreground)' 
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: 'var(--session-subtext)' }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: 'var(--session-subtext)' }} />
                  )}
                </button>
              </div>
                {/* Password strength rules */}
                <PasswordRules password={formData.password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: 'var(--section-border)', 
                  color: 'var(--foreground)' 
                }}
                placeholder="Confirm your password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !validatePassword(formData.password)}
                title={!validatePassword(formData.password) ? 'Password must meet strength requirements' : undefined}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
