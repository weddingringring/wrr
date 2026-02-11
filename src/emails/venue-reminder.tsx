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
  warningBoxStyle,
} from './components/EmailLayout'

interface VenueReminderEmailProps {
  venueName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  phoneNumber: string
  setupUrl: string
}

export const VenueReminderEmail = ({
  venueName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  phoneNumber,
  setupUrl,
}: VenueReminderEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}'s ${eventType}`
    : `${partner1FirstName} ${partner1LastName}'s ${eventType}`

  return (
    <EmailLayout preview={`Event Tomorrow - Setup Required for ${eventName}`}>
      <Heading style={headingStyle}>Event Tomorrow - Action Required! ⚠️</Heading>
      
      <Text style={textStyle}>Hi {venueName},</Text>
      
      <div style={warningBoxStyle}>
        <Text style={{ fontSize: '16px', fontWeight: '600', margin: '0', color: '#2C2C2C' }}>
          Important: You have a WeddingRingRing event TOMORROW!
        </Text>
      </div>

      {/* Event Details */}
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
          })} (TOMORROW)
        </Text>
        <Text style={labelStyle}>Phone Number</Text>
        <Text style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#2D5016',
          margin: '8px 0',
          fontFamily: 'monospace',
        }}>
          {phoneNumber}
        </Text>
      </div>

      {/* Action Required */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>Action Required Today:</Text>
      <Text style={{ ...textStyle, marginLeft: '20px' }}>
        1. Review setup instructions<br />
        2. Charge the phone overnight<br />
        3. Test the phone works (dial 1 to hear greeting)<br />
        4. Prepare to set up on-site tomorrow
      </Text>

      <Button href={setupUrl} style={buttonStyle}>
        View Setup Instructions
      </Button>

      {/* Setup Code */}
      <div style={{
        ...boxStyle,
        backgroundColor: '#FAF8F3',
        border: '2px solid #2D5016',
      }}>
        <Text style={{ ...labelStyle, marginBottom: '8px' }}>
          Setup Code (you'll need this tomorrow):
        </Text>
        <Text style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#2D5016',
          margin: '0',
          fontFamily: 'monospace',
        }}>
          *02#1#{phoneNumber}*
        </Text>
      </div>

      <Text style={textStyle}>
        Need help? Contact{' '}
        <Link href="mailto:support@weddingringring.com" style={{ color: '#2D5016' }}>
          support@weddingringring.com
        </Link>
        {' '}(urgent)
      </Text>

      <Text style={textStyle}>
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default VenueReminderEmail
