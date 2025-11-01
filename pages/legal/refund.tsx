import Head from 'next/head'

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Company'
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com'

export default function RefundPage() {
  const updated = new Date().toLocaleDateString()
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Head>
        <title>Cancellation & Refund Policy | {COMPANY}</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Cancellation & Refund Policy</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {updated}</p>

      <section className="prose max-w-none">
        <p>
          This policy describes how cancellations and refunds are handled for our digital
          consulting services, live batches, and recorded courses.
        </p>

        <h2>1. Digital Consulting Sessions</h2>
        <ul>
          <li>Full refund for cancellations made at least 24 hours before the session start.</li>
          <li>No refund for cancellations within 24 hours of the session or for no‑shows.</li>
          <li>One free reschedule allowed if requested at least 24 hours in advance.</li>
        </ul>

        <h2>2. Live Batches (Cohort Classes)</h2>
        <ul>
          <li>Refunds are available up to 7 calendar days before the announced start date.</li>
          <li>Once a batch has started, fees are non‑refundable.</li>
          <li>If we cancel or materially postpone a batch, you may choose a full refund or transfer to a future batch.</li>
        </ul>

        <h2>3. Recorded / On‑Demand Courses</h2>
        <ul>
          <li>Due to the nature of digital content, purchases are generally non‑refundable once access is granted.</li>
          <li>If you face technical issues preventing access, contact support for assistance; where we cannot resolve, a refund may be considered at our discretion.</li>
        </ul>

        <h2>4. How to Request a Refund</h2>
        <p>
          Email your order ID, registered email, and reason for refund to
          <a href={`mailto:${EMAIL}`}> {EMAIL}</a>. Eligible refunds are typically processed to the original payment method within 5–7
          business days after approval. Processing timelines may vary by bank or provider.
        </p>

        <h2>5. Chargebacks</h2>
        <p>
          Please contact us to resolve any issues before raising a chargeback. Unauthorized
          or unfounded chargebacks may lead to account suspension.
        </p>

        <h2>6. Exceptions</h2>
        <p>
          We reserve the right to refuse a refund in cases of policy abuse, suspected fraud,
          or violation of our Terms & Conditions.
        </p>

        <h2>7. Contact</h2>
        <p>
          For questions about this policy, email us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>
    </main>
  )
}
