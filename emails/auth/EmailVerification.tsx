import React from 'react'
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export interface EmailVerificationProps {
  firstName?: string
  verificationUrl: string
  logoUrl?: string
  productName?: string
}

export function EmailVerification({ firstName = 'there', verificationUrl, logoUrl, productName = 'SAPIntegrationExpert' }: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: 20, backgroundColor: '#ffffff', borderRadius: 8 }}>
          <table role="presentation" width="100%" style={{ marginBottom: 12 }}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    <span style={{ color: '#0b5ea8' }}>SAP</span>
                    <span style={{ color: '#111827', marginLeft: 6 }}>Integration Expert</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <Heading style={{ marginBottom: 8 }}>Verify your email</Heading>
          <Text>Hi {firstName},</Text>
          <Text style={{ marginBottom: 16 }}>Please confirm your email address by clicking the button below.</Text>
          <Button style={{ backgroundColor: '#0ea5e9', color: '#fff', borderRadius: 6, padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }} href={verificationUrl}>
            Verify email
          </Button>
          <Text style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>If you didn't request this, you can ignore this email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailVerification
