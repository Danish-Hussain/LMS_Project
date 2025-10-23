"use client"

import { useState, useEffect } from 'react'
import useToast from '@/hooks/useToast'

export default function ContactModal({ open, onClose, defaultName, defaultEmail }: { open: boolean; onClose: () => void; defaultName?: string; defaultEmail?: string }) {
  const [name, setName] = useState(defaultName || '')
  const [email, setEmail] = useState(defaultEmail || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (defaultName) setName(defaultName)
    if (defaultEmail) setEmail(defaultEmail)
  }, [defaultName, defaultEmail])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Message sent — we will reply soon!')
      setName('')
      setEmail('')
      setMessage('')
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to send message. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="rounded-xl p-8 w-full max-w-lg shadow-lg border"
        style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}
      >
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Contact Us</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--session-text)' }}>Name</label>
            <input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              style={{ background: 'var(--input-background)', color: 'var(--input-text)', border: '1px solid var(--input-border)' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--session-text)' }}>Email</label>
            <input
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              style={{ background: 'var(--input-background)', color: 'var(--input-text)', border: '1px solid var(--input-border)' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--session-text)' }}>Message</label>
            <textarea
              placeholder="Tell us how we can help — whether it’s for queries, support, mentorship, or collaboration..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
              style={{ background: 'var(--input-background)', color: 'var(--input-text)', border: '1px solid var(--input-border)' }}
              rows={5}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-medium border"
              style={{ background: 'var(--background)', color: 'var(--session-text)', borderColor: 'var(--section-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg font-medium"
              style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
