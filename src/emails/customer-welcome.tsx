import { Button, Heading, Link, Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailLayout,
  buttonStyle,
  headingStyle,
  textStyle,
  labelStyle,
  valueStyle,
  boxStyle,
} from './components/EmailLayout'

interface CustomerWelcomeEmailProps {
  customerFirstName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  venueName: string
  customerEmail: string
  temporaryPassword: string
  dashboardUrl: string
}

export const CustomerWelcomeEmail = ({
  customerFirstName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  venueName,
  customerEmail,
  temporaryPassword,
  dashboardUrl,
}: CustomerWelcomeEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}'s ${eventType}`
    : `${partner1FirstName} ${partner1LastName}'s ${eventType}`

  return (
    <EmailLayout preview={`Welcome to WeddingRingRing - Your ${eventType} is ready!`}>
      <Heading style={headingStyle}>Welcome to WeddingRingRing!</Heading>
      
      <Text style={textStyle}>Hi {customerFirstName},</Text>
      
      <Text style={textStyle}>
        Your WeddingRingRing audio guestbook is all set up!
      </Text>

      {/* Event Details */}
      <div style={boxStyle}>
        <Text style={labelStyle}>Event Details</Text>
        <Text style={valueStyle}>{eventName}</Text>
        <Text style={labelStyle}>Date</Text>
        <Text style={valueStyle}>{new Date(eventDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</Text>
        <Text style={labelStyle}>Venue</Text>
        <Text style={valueStyle}>{venueName}</Text>
      </div>

      {/* Login Credentials */}
      <div style={boxStyle}>
        <Text style={labelStyle}>Your Account</Text>
        <Text style={{ ...textStyle, margin: '8px 0' }}>
          <strong>Email:</strong> {customerEmail}
        </Text>
        <Text style={{ ...textStyle, margin: '8px 0' }}>
          <strong>Temporary Password:</strong> {temporaryPassword}
        </Text>
        <Text style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600', margin: '8px 0 0' }}>
          You'll be required to change this password on first login
        </Text>
      </div>

      <Button href={dashboardUrl} style={buttonStyle}>
        Log In to Your Account
      </Button>

      {/* What's Next */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>What's Next?</Text>
      <Text style={{ ...textStyle, marginLeft: '20px' }}>
        1. Log in to your dashboard<br />
        2. Set your new password<br />
        3. Your audio guestbook will be active 30 days before your event<br />
        4. Messages from guests will appear in your dashboard
      </Text>

      <Text style={textStyle}>
        Questions? Reply to this email or contact{' '}
        <Link href="mailto:support@weddingringring.com" style={{ color: '#2D5016' }}>
          support@weddingringring.com
        </Link>
      </Text>

      <Text style={textStyle}>
        Best wishes,<br />
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default CustomerWelcomeEmail
