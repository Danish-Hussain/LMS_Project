import React from 'react'
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export interface NewLessonEmailProps {
  firstName?: string
  courseName: string
  lessonTitle: string
  lessonUrl?: string
  logoUrl?: string
  productName?: string
}

export function NewLessonEmail({ firstName = 'Student', courseName, lessonTitle, lessonUrl = '/', logoUrl, productName = 'SAPIntegrationExpert' }: NewLessonEmailProps) {
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
          <Heading style={{ marginBottom: 8 }}>New lesson available</Heading>
          <Text>Hi {firstName},</Text>
          <Text style={{ marginBottom: 16 }}>A new lesson <strong>{lessonTitle}</strong> was added to <strong>{courseName}</strong>.</Text>
          <Button style={{ backgroundColor: '#0ea5e9', color: '#fff', borderRadius: 6, padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }} href={lessonUrl}>
            View lesson
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

export default NewLessonEmail
