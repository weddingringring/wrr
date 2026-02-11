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

interface PhoneAssignedEmailProps {
  customerFirstName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  phoneNumber: string
  dashboardUrl: string
}

export const PhoneAssignedEmail = ({
  customerFirstName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  phoneNumber,
  dashboardUrl,
}: PhoneAssignedEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}'s ${eventType}`
    : `${partner1FirstName} ${partner1LastName}'s ${eventType}`

  return (
    <EmailLayout preview="Your WeddingRingRing audio guestbook is ready!">
      <Heading style={headingStyle}>Your Audio Guestbook is Ready! 📞</Heading>
      
      <Text style={textStyle}>Hi {customerFirstName},</Text>
      
      <Text style={textStyle}>
        Great news! Your audio guestbook phone number is ready.
      </Text>

      {/* Phone Number */}
      <div style={{
        ...boxStyle,
        backgroundColor: '#2D5016',
        borderColor: '#2D5016',
        textAlign: 'center',
      }}>
        <Text style={{ ...labelStyle, color: '#C5D5B8' }}>Your Audio Guestbook Number</Text>
        <Text style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#ffffff',
          margin: '8px 0',
          fontFamily: 'monospace',
        }}>
          {phoneNumber}
        </Text>
      </div>

      {/* Event Info */}
      <div style={boxStyle}>
        <Text style={labelStyle}>Event</Text>
        <Text style={valueStyle}>{eventName}</Text>
        <Text style={labelStyle}>Date</Text>
        <Text style={valueStyle}>
          {new Date(eventDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} (30 days away!)
        </Text>
      </div>

      {/* What This Means */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>What This Means:</Text>
      <Text style={{ ...textStyle, marginLeft: '20px' }}>
        • Guests can now call this number to leave audio messages<br />
        • The venue will set up the phone on your event day<br />
        • All messages will appear in your dashboard<br />
        • You can listen and download them anytime
      </Text>

      <Button href={dashboardUrl} style={buttonStyle}>
        View Your Dashboard
      </Button>

      <Text style={textStyle}>
        The venue has been notified and will receive setup instructions.
      </Text>

      <Text style={textStyle}>
        Looking forward to your special day!<br />
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default PhoneAssignedEmail
