import React from 'react'
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export interface WelcomeEmailProps {
  firstName?: string
  loginUrl?: string
  logoUrl?: string
  productName?: string
}

export function WelcomeEmail({ firstName = 'there', loginUrl = '/', logoUrl, productName = 'SAPIntegrationExpert' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: 20, backgroundColor: '#fff', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: '#0b5ea8' }}>SAP</span>
              <span style={{ color: '#111827', marginLeft: 6 }}>Integration Expert</span>
            </div>
          </div>
          <Heading style={{ marginBottom: 8 }}>Welcome to {productName}</Heading>
          <Text>Hi {firstName},</Text>
          <Text style={{ marginBottom: 16 }}>Thanks for joining — we're excited to have you on board.</Text>
          <Button style={{ backgroundColor: '#0ea5e9', color: '#fff', borderRadius: 6, padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }} href={loginUrl}>
            Go to your dashboard
          </Button>
          <Text style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>If you need help, reply to this email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail
