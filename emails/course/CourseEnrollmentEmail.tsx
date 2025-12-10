import React from 'react'
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export interface CourseEnrollmentEmailProps {
  firstName?: string
  courseName: string
  courseUrl?: string
  logoUrl?: string
  productName?: string
}

export function CourseEnrollmentEmail({ firstName = 'Student', courseName, courseUrl = '/', logoUrl, productName = 'SAPIntegrationExpert' }: CourseEnrollmentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: 20, backgroundColor: '#fff', borderRadius: 8 }}>
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
          <Heading style={{ marginBottom: 8 }}>You're enrolled!</Heading>
          <Text>Hi {firstName},</Text>
          <Text style={{ marginBottom: 16 }}>You've been enrolled in <strong>{courseName}</strong>. Click below to start learning.</Text>
          <Button style={{ backgroundColor: '#0ea5e9', color: '#fff', borderRadius: 6, padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }} href={courseUrl}>
            Go to course
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

export default CourseEnrollmentEmail
