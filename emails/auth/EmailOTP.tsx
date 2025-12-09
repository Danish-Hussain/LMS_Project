import React from 'react'
import { Html, Head, Body, Container, Heading, Text } from '@react-email/components'

export interface EmailOTPProps {
  firstName?: string
  otp: string
  expiresAt?: string
  logoUrl?: string
  productName?: string
}

export function EmailOTP({ firstName = 'there', otp, expiresAt, logoUrl, productName = 'SAPIntegrationExpert' }: EmailOTPProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ margin: '32px auto', padding: 24, backgroundColor: '#ffffff', borderRadius: 12, maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: '#0b5ea8' }}>SAP</span>
              <span style={{ color: '#111827', marginLeft: 6 }}>Integration Expert</span>
            </div>
          </div>

          <Heading style={{ margin: '6px 0 12px 0', fontSize: 20 }}>Verify your email</Heading>

          <Text style={{ marginBottom: 10, color: '#374151' }}>Hi {firstName},</Text>

          <Text style={{ marginBottom: 18, color: '#4b5563' }}>Use the verification code below to confirm your email address. The code is valid for 10 minutes.</Text>

          <div style={{ backgroundColor: '#f3f4f6', padding: '18px', borderRadius: 8, textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 6, color: '#0b5ea8' }}>{otp}</div>
          </div>

          {expiresAt && <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Expires at: {new Date(expiresAt).toLocaleString()}</Text>}

          <Text style={{ fontSize: 13, color: '#6b7280' }}>If you didn’t request this code, you can safely ignore this email.</Text>

          <div style={{ marginTop: 22, borderTop: '1px solid #e6e9ef', paddingTop: 12 }}>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{productName} — if you need help, reply to this email.</Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailOTP
