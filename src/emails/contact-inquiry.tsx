import { Heading, Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

interface ContactInquiryEmailProps {
  inquiryType: string
  name: string
  venueName: string
  email: string
  phone: string
  message: string
  previewText: string
}

export const ContactInquiryEmail = ({
  inquiryType,
  name,
  venueName,
  email,
  phone,
  message,
  previewText,
}: ContactInquiryEmailProps) => {
  return (
    <EmailLayout preview={previewText}>
      <Heading style={{ fontSize: '24px', color: '#2D5016', marginBottom: '16px' }}>
        New Website Inquiry
      </Heading>
      
      <Section style={{ backgroundColor: '#FAF8F3', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <Text style={{ margin: '8px 0', color: '#2C2C2C' }}>
          <strong>Type:</strong> {inquiryType}
        </Text>
        <Text style={{ margin: '8px 0', color: '#2C2C2C' }}>
          <strong>Name:</strong> {name}
        </Text>
        <Text style={{ margin: '8px 0', color: '#2C2C2C' }}>
          <strong>Venue:</strong> {venueName}
        </Text>
        <Text style={{ margin: '8px 0', color: '#2C2C2C' }}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={{ margin: '8px 0', color: '#2C2C2C' }}>
          <strong>Phone:</strong> {phone}
        </Text>
      </Section>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2C2C2C' }}>Message:</Text>
        <Text style={{ color: '#5A5A5A', whiteSpace: 'pre-wrap' }}>{message}</Text>
      </Section>
    </EmailLayout>
  )
}

export default ContactInquiryEmail
