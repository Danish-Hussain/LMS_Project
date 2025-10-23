"use client"

import { useState } from 'react'
import useToast from '@/hooks/useToast'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password do not match')
        setLoading(false)
        return
      }

      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Password changed')
      setCurrentPassword('')
  setNewPassword('')
  setConfirmPassword('')
    } catch (err) {
      toast.error('Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        Change password
      </h1>
      <form onSubmit={handleSubmit} className="shadow rounded-md p-4 space-y-3" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--session-text)' }}>Current password</label>
          <div className="relative mt-1">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your old password"
              className="block w-full border rounded-md px-3 py-2 pr-10"
              required
            />
            <button
              type="button"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              onClick={() => setShowCurrent((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--session-text)' }}>New password</label>
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full border rounded-md px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                onClick={() => setShowNew((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--session-text)' }}>Confirm new password</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full border rounded-md px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
        </div>
        <div className="flex justify-end gap-3">
          <Link
            href="/account"
            aria-label="Cancel and go back to account"
            className="px-4 py-2 rounded-md border"
            style={{
              borderColor: 'var(--section-border)',
              color: 'var(--session-text)',
              background: 'transparent'
            }}
          >
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">{loading ? 'Saving...' : 'Change password'}</button>
        </div>
      </form>
    </div>
  )
}
