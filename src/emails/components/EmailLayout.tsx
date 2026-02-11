import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.svg`}
              alt="WeddingRingRing"
              width="200"
              height="67"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              WeddingRingRing - Capture Audio Messages from Your Special Day
            </Text>
            <Text style={footerText}>
              Need help? Email{' '}
              <Link href="mailto:support@weddingringring.com" style={link}>
                support@weddingringring.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#FAF8F3',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 0',
  textAlign: 'center' as const,
  borderBottom: '1px solid #C5D5B8',
}

const content = {
  padding: '32px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  marginTop: '24px',
}

const footer = {
  marginTop: '32px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6B8E5C',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
}

const link = {
  color: '#2D5016',
  textDecoration: 'underline',
}

// Export common button style
export const buttonStyle = {
  backgroundColor: '#2D5016',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '16px 0',
}

// Export common text styles
export const headingStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#2C2C2C',
  margin: '0 0 16px',
}

export const textStyle = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#2C2C2C',
  margin: '0 0 16px',
}

export const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6B8E5C',
  margin: '0 0 4px',
}

export const valueStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2C2C2C',
  margin: '0 0 16px',
}

export const boxStyle = {
  backgroundColor: '#FAF8F3',
  border: '1px solid #C5D5B8',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}

export const warningBoxStyle = {
  backgroundColor: '#FEF3C7',
  border: '1px solid #FCD34D',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
