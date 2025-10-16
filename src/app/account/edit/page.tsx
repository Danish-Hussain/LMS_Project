"use client"

import { useState } from 'react'
import useToast from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'

export default function AccountEditPage() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      // update client-side auth context if available
      if (setUser) setUser(updated)
      toast.success('Account updated')
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
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">{loading ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}
