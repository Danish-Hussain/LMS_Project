"use client"

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

function initials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
}

export default function AccountPage() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Account details</h1>
        <div className="flex items-center gap-3">
          <Link href="/account/change-password" className="text-sm text-blue-600 hover:underline">Change password</Link>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Log out</button>
        </div>
      </div>

      <div className="bg-white shadow rounded-md p-6 flex gap-6 items-center">
        <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
          {initials(user?.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">{user?.name ?? '—'}</h2>
              <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/account/edit" className="px-3 py-1 border rounded text-sm">Edit</Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Role</div>
              <div className="font-medium">{user?.role ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">User ID</div>
              <div className="font-mono text-xs text-gray-600">{user?.id ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
