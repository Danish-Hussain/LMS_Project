import Head from 'next/head'

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Company'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com'
const ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Please update company address in env'
const COUNTRY = process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'India'

export default function TermsPage() {
  const updated = new Date().toLocaleDateString()
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Head>
        <title>Terms & Conditions | {COMPANY}</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {updated}</p>

      <section className="prose max-w-none">
        <p>
          These Terms & Conditions ("Terms") govern your access to and use of {COMPANY}'s
          website and services available at {SITE} (collectively, the "Services"). By
          accessing or using the Services, you agree to be bound by these Terms.
        </p>

        <h2>1. Eligibility and Accounts</h2>
        <p>
          You must be capable of entering into a legally binding agreement to use the
          Services. You are responsible for all activity that occurs under your account
          and for keeping your credentials secure. Provide accurate information and
          promptly update it when changes occur.
        </p>

        <h2>2. Courses, Recordings, and Consulting</h2>
        <p>
          We provide access to live batches, recorded courses, and/or digital consulting
          sessions. Access may be time‑bound and non‑transferable. You agree not to share
          login details or redistribute our content without written permission.
        </p>

        <h2>3. Payments</h2>
        <p>
          Paid Services must be purchased in advance. Payments are processed securely by
          our payment partners (including Razorpay Software Private Limited). You
          authorize us and our processors to charge your selected payment method for the
          applicable fees and taxes. Prices may change from time to time; the price at
          checkout is final for that transaction.
        </p>

        <h2>4. Cancellations and Refunds</h2>
        <p>
          Our Cancellation & Refund Policy forms part of these Terms. Please review it at
          <a href="/legal/refund"> /legal/refund</a> before purchasing.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content, trademarks, logos, course materials, videos, and documentation are
          the property of {COMPANY} or its licensors. You receive a limited, personal,
          non‑exclusive, non‑transferable license to access the content solely for your
          own learning purposes. Any reproduction, distribution, public performance,
          or derivative works require prior written consent.
        </p>

        <h2>6. Acceptable Use</h2>
        <ul>
          <li>Do not share, resell, or make the Services available to third parties.</li>
          <li>Do not attempt to bypass technical restrictions or copy the content.</li>
          <li>Do not upload unlawful, infringing, or harmful content.</li>
          <li>Do not disrupt or interfere with the availability or security of the Services.</li>
        </ul>

        <h2>7. Privacy</h2>
        <p>
          Our collection and use of personal data are described in our
          <a href="/legal/privacy"> Privacy Policy</a>.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The Services are provided on an "as is" and "as available" basis. To the extent
          permitted by law, we disclaim all warranties, express or implied, including
          warranties of merchantability, fitness for a particular purpose, and
          non‑infringement. We do not guarantee specific outcomes or job placements.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, {COMPANY} will not be liable
          for any indirect, incidental, special, consequential, or punitive damages, or for
          any loss of profits, revenues, data, or goodwill, arising from or related to your
          use of the Services.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Services after
          changes become effective constitutes acceptance of the revised Terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms and any disputes arising out of or related to them are governed by
          the laws of {COUNTRY}, without regard to its conflict of law principles.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these Terms? Contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or by mail at:
          <br />
          {ADDRESS}
        </p>
      </section>
    </main>
  )
}
