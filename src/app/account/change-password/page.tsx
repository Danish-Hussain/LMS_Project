"use client"

import { useState } from 'react'
import useToast from '@/hooks/useToast'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
      <h1 className="text-2xl font-semibold mb-4">Change password</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-md p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">{loading ? 'Saving...' : 'Change password'}</button>
        </div>
      </form>
    </div>
  )
}
