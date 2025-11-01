import Link from 'next/link'

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Company'

export default function Footer() {
  return (
    <footer className="border-t mt-10" style={{ borderColor: 'var(--section-border)', background: 'var(--background)' }}>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm" style={{ color: 'var(--session-subtext)' }}>
            © {new Date().getFullYear()} {COMPANY}. All rights reserved.
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/contact" className="hover:underline" style={{ color: 'var(--session-text)' }}>Contact Us</Link>
            <Link href="/legal/terms" className="hover:underline" style={{ color: 'var(--session-text)' }}>Terms & Conditions</Link>
            <Link href="/legal/privacy" className="hover:underline" style={{ color: 'var(--session-text)' }}>Privacy Policy</Link>
            <Link href="/legal/shipping" className="hover:underline" style={{ color: 'var(--session-text)' }}>Shipping & Delivery</Link>
            <Link href="/legal/refund" className="hover:underline" style={{ color: 'var(--session-text)' }}>Cancellation & Refund</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
