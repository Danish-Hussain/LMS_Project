"use client"

import { useState } from 'react'
import useToast from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountEditPage() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      // update client-side auth context if available
      if (setUser) setUser(updated)
      toast.success('Account updated')
      // Navigate back to the account page after success
      router.push('/account')
    } catch (err) {
      toast.error('Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Edit account</h1>
      <form onSubmit={handleSubmit} className="shadow rounded-md p-4 space-y-3" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--session-text)' }}>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--session-text)' }}>Email</label>
          <input type="email" value={email} readOnly disabled className="mt-1 block w-full border rounded-md px-3 py-2 opacity-80 cursor-not-allowed bg-gray-50" />
          <p className="text-xs mt-1" style={{ color: 'var(--session-subtext)' }}>Email can’t be changed. Contact support if you need to transfer your account.</p>
        </div>
        <div className="flex justify-end gap-3">
          <Link
            href="/account"
            aria-label="Cancel editing and go back to account"
            className="px-4 py-2 rounded-md border"
            style={{
              borderColor: 'var(--section-border)',
              color: 'var(--session-text)',
              background: 'transparent'
            }}
          >
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">{loading ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}
