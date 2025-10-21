"use client"

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function initials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const [copied, setCopied] = useState(false)

  const formatRole = (role?: string) => {
    if (!role) return '—'
    const r = String(role).toUpperCase()
    switch (r) {
      case 'ADMIN':
        return 'Admin'
      case 'INSTRUCTOR':
        return 'Instructor'
      case 'STUDENT':
        return 'Student'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    }
  }

  const copyUserId = async () => {
    if (!user?.id) return
    try {
      await navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {
      // no-op
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Account details
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/account/change-password" className="text-sm text-blue-600 hover:underline">Change Password</Link>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Log Out</button>
        </div>
      </div>

      <div className="shadow rounded-xl p-6 flex gap-6 items-center" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
        <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-blue-100/70 shadow">
          {initials(user?.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{user?.name ?? '—'}</h2>
              <p className="text-sm" style={{ color: 'var(--session-subtext)' }}>{user?.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/account/edit" className="px-3 py-1.5 border rounded-md text-sm hover-bg-accent" style={{ borderColor: 'var(--section-border)', color: 'var(--foreground)' }}>Edit</Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--session-text)' }}>
            <div>
              <div className="text-xs" style={{ color: 'var(--session-subtext)' }}>Role</div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formatRole(user?.role)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--session-subtext)' }}>User ID</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs break-all" style={{ color: 'var(--session-subtext)' }}>{user?.id ?? '—'}</span>
                {user?.id && (
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover-bg-accent"
                    style={{ borderColor: 'var(--section-border)', color: 'var(--session-text)' }}
                    aria-label={copied ? 'Copied' : 'Copy user id'}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
