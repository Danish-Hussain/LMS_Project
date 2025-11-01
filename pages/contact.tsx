import Head from 'next/head'
import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send your message. Please try again later.')
      }

      setSuccess('Thanks! Your message has been sent.')
      setName('')
      setEmail('')
      setMessage('')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Contact Us</title>
        <meta name="description" content="Get in touch with us via the contact form" />
      </Head>
      <section className="py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--session-text)' }}>Contact Us</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--session-subtext)' }}>
            Have a question, feedback, or need help? Send us a message and we’ll get back to you.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm mb-1" style={{ color: 'var(--session-subtext)' }}>Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-transparent"
                style={{ borderColor: 'var(--section-border)', color: 'var(--session-text)' }}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm mb-1" style={{ color: 'var(--session-subtext)' }}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-transparent"
                style={{ borderColor: 'var(--section-border)', color: 'var(--session-text)' }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm mb-1" style={{ color: 'var(--session-subtext)' }}>Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-transparent min-h-[140px]"
                style={{ borderColor: 'var(--section-border)', color: 'var(--session-text)' }}
                placeholder="How can we help?"
                required
              />
            </div>

            {error && (
              <div className="text-sm" style={{ color: '#dc2626' }}>{error}</div>
            )}
            {success && (
              <div className="text-sm" style={{ color: '#16a34a' }}>{success}</div>
            )}

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded font-medium"
              style={{ background: 'var(--button-bg)', color: 'var(--button-fg)', opacity: submitting ? 0.8 : 1 }}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
