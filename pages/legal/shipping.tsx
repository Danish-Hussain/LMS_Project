import Head from 'next/head'

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Company'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com'

export default function ShippingPage() {
  const updated = new Date().toLocaleDateString()
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Head>
        <title>Shipping & Delivery Policy | {COMPANY}</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Shipping & Delivery Policy</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {updated}</p>

      <section className="prose max-w-none">
        <p>
          {COMPANY} provides digital products and services via {SITE}. We do not ship any
          physical goods. All offerings are delivered electronically.
        </p>

        <h2>1. Digital Delivery</h2>
        <ul>
          <li>Course access is granted to your registered account upon successful payment.</li>
          <li>For live batches, schedules are shared in your dashboard and/or by email.</li>
          <li>
            For recorded/on‑demand content, access is typically available immediately after
            payment. If manual review is required, activation occurs within 24 business hours.
          </li>
        </ul>

        <h2>2. Order Confirmation</h2>
        <p>
          You will receive an on‑screen and/or email confirmation after a successful
          transaction. If you do not receive confirmation within a reasonable time, contact
          us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>

        <h2>3. Failed/Delayed Delivery</h2>
        <p>
          In rare cases of payment success but access not reflecting, please log out and
          log in again. If the issue persists, contact support with your order details—we
          will investigate and grant access as soon as possible.
        </p>

        <h2>4. No Physical Shipping</h2>
        <p>
          We do not ship physical items. Any address collected (if at all) is used for
          billing, tax, or compliance purposes only.
        </p>

        <h2>5. Contact</h2>
        <p>
          For delivery questions, contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>
    </main>
  )
}
