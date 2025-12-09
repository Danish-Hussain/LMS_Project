import React from 'react'
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export interface CourseCompletionEmailProps {
  firstName?: string
  courseName: string
  certificateUrl?: string
  logoUrl?: string
  productName?: string
}

export function CourseCompletionEmail({ firstName = 'Student', courseName, certificateUrl, logoUrl, productName = 'SAPIntegrationExpert' }: CourseCompletionEmailProps) {
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
          <Heading style={{ marginBottom: 8 }}>Congratulations!</Heading>
          <Text>Hi {firstName},</Text>
          <Text style={{ marginBottom: 16 }}>You have completed <strong>{courseName}</strong>. Great job!</Text>
          {certificateUrl ? (
            <Button style={{ backgroundColor: '#10b981', color: '#fff', borderRadius: 6, padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }} href={certificateUrl}>
              View your certificate
            </Button>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

export default CourseCompletionEmail
