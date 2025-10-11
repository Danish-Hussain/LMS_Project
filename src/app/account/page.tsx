"use client"

import { useAuth } from '@/contexts/AuthContext'

export default function AccountPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Account details</h1>
      <div className="bg-white shadow rounded-md p-4">
        <p><strong>Name:</strong> {user?.name ?? '—'}</p>
        <p><strong>Email:</strong> {user?.email ?? '—'}</p>
        <p><strong>Role:</strong> {user?.role ?? '—'}</p>
      </div>
    </div>
  )
}
