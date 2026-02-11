import { Heading, Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

interface ContactConfirmationEmailProps {
  name: string
  venueName: string
}

export const ContactConfirmationEmail = ({
  name,
  venueName,
}: ContactConfirmationEmailProps) => {
  const firstName = name.split(' ')[0]
  
  return (
    <EmailLayout preview="Thank you for reaching out to WeddingRingRing">
      <Heading style={{ fontSize: '24px', color: '#2D5016', marginBottom: '16px' }}>
        Thank You, {firstName}!
      </Heading>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
        We've received your inquiry about WeddingRingRing for {venueName}.
      </Text>

      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
        Our team will review your information and get back to you within 24 hours.
      </Text>

      <Section style={{ backgroundColor: '#FAF8F3', padding: '16px', borderRadius: '8px', margin: '24px 0' }}>
        <Text style={{ fontSize: '14px', fontWeight: '600', color: '#6B8E5C', margin: '0 0 8px' }}>
          What happens next?
        </Text>
        <Text style={{ fontSize: '14px', lineHeight: '20px', color: '#2C2C2C', margin: '0', marginLeft: '20px' }}>
          1. We'll review your inquiry<br />
          2. A team member will reach out via email or phone<br />
          3. We'll answer all your questions<br />
          4. We'll discuss how WeddingRingRing can work for you
        </Text>
      </Section>

      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
        In the meantime, if you have any urgent questions, feel free to reply to this email or call us at +44 20 1234 5678.
      </Text>

      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
        Looking forward to speaking with you soon!<br />
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default ContactConfirmationEmail
