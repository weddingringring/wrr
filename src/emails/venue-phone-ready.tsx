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

interface VenuePhoneReadyEmailProps {
  venueName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  phoneNumber: string
  setupUrl: string
  greetingText: string
}

export const VenuePhoneReadyEmail = ({
  venueName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  phoneNumber,
  setupUrl,
  greetingText,
}: VenuePhoneReadyEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}'s ${eventType}`
    : `${partner1FirstName} ${partner1LastName}'s ${eventType}`

  return (
    <EmailLayout preview={`Phone Number Ready - Setup Required for ${new Date(eventDate).toLocaleDateString('en-GB')}`}>
      <Heading style={headingStyle}>Phone Number Ready - Setup Required 📱</Heading>
      
      <Text style={textStyle}>Hi {venueName},</Text>
      
      <Text style={textStyle}>
        The phone number for your upcoming WeddingRingRing event is ready.
      </Text>

      {/* Event Details */}
      <div style={boxStyle}>
        <Text style={labelStyle}>Event Details</Text>
        <Text style={valueStyle}>{eventName}</Text>
        <Text style={labelStyle}>Date</Text>
        <Text style={valueStyle}>
          {new Date(eventDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} (30 days away)
        </Text>
        <Text style={labelStyle}>Phone Number</Text>
        <Text style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#2D5016',
          margin: '8px 0',
          fontFamily: 'monospace',
        }}>
          {phoneNumber}
        </Text>
      </div>

      {/* Greeting */}
      <div style={boxStyle}>
        <Text style={labelStyle}>Greeting Message (guests will hear this):</Text>
        <Text style={{
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#2C2C2C',
          margin: '8px 0 0',
        }}>
          "{greetingText}"
        </Text>
      </div>

      {/* Action Required */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>Action Required:</Text>
      <Text style={textStyle}>
        Please review the setup instructions before the event day.
      </Text>

      <Button href={setupUrl} style={buttonStyle}>
        View Setup Instructions
      </Button>

      <Text style={textStyle}>
        The phone will need to be programmed on the event day using this number.
        Full instructions are available in your dashboard.
      </Text>

      <Text style={textStyle}>
        Questions? Contact{' '}
        <Link href="mailto:support@weddingringring.com" style={{ color: '#2D5016' }}>
          support@weddingringring.com
        </Link>
      </Text>

      <Text style={textStyle}>
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default VenuePhoneReadyEmail
