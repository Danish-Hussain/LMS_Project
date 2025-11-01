import Head from 'next/head'

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Company'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com'
const ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Please update company address in env'
const COUNTRY = process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'India'

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString()
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Head>
        <title>Privacy Policy | {COMPANY}</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {updated}</p>

      <section className="prose max-w-none">
        <p>
          This Privacy Policy explains how {COMPANY} ("we", "us") collects, uses, and
          protects your personal data when you access {SITE} and use our Services.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account and profile information (name, email, phone where provided).</li>
          <li>Transactional data related to purchases and enrollments.</li>
          <li>Usage data such as pages viewed, features used, and device/browser info.</li>
          <li>Support communications and feedback you provide.</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>To provide and improve our courses, batches, and consulting sessions.</li>
          <li>To process payments and prevent fraud (via third‑party processors like Razorpay).</li>
          <li>To send essential service communications and respond to support requests.</li>
          <li>To analyze usage and enhance user experience.</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <h2>3. Legal Bases</h2>
        <p>
          Where required by law, we process personal data based on consent, contract
          performance, legitimate interests, and/or compliance with legal obligations.
        </p>

        <h2>4. Cookies and Similar Technologies</h2>
        <p>
          We use cookies/local storage for authentication, preferences, analytics, and
          security. You may control cookies via your browser settings; some features may
          not function properly if cookies are disabled.
        </p>

        <h2>5. Sharing with Third Parties</h2>
        <p>
          We may share data with service providers strictly for operating our Services,
          such as payment processing (e.g., Razorpay), email/SMS delivery, analytics, and
          infrastructure providers. We do not sell personal data.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain personal data for as long as necessary to provide the Services and for
          legitimate business or legal purposes. Retention periods vary based on the type
          of data and our obligations.
        </p>

        <h2>7. Security</h2>
        <p>
          We implement technical and organizational measures designed to protect personal
          data. No method of transmission or storage is 100% secure; we cannot guarantee
          absolute security.
        </p>

        <h2>8. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, update,
          or delete certain personal data, and to object to or restrict processing. To
          exercise these rights, contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>

        <h2>9. International Transfers</h2>
        <p>
          Where data is transferred across borders, we take steps consistent with
          applicable law to protect your data.
        </p>

        <h2>10. Children</h2>
        <p>
          Our Services are not intended for children under the age of 13 (or the minimum
          age in your jurisdiction). We do not knowingly collect data from children.
        </p>

        <h2>11. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be
          posted on this page with an updated date.
        </p>

        <h2>12. Contact</h2>
        <p>
          For questions or requests regarding this Policy, contact {COMPANY} at
          <a href={`mailto:${EMAIL}`}> {EMAIL}</a> or by mail: {ADDRESS}, {COUNTRY}.
        </p>
      </section>
    </main>
  )
}
