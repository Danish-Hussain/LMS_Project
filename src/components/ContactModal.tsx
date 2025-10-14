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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea placeholder="Enter your message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" rows={5} required />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white">{loading ? 'Sending...' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
