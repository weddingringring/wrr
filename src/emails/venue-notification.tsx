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

interface VenueNotificationEmailProps {
  venueName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  customerEmail: string
  eventDetailsUrl: string
}

export const VenueNotificationEmail = ({
  venueName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  customerEmail,
  eventDetailsUrl,
}: VenueNotificationEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}'s ${eventType}`
    : `${partner1FirstName} ${partner1LastName}'s ${eventType}`

  return (
    <EmailLayout preview={`Event Created - ${eventName}`}>
      <Heading style={headingStyle}>Event Created Successfully</Heading>
      
      <Text style={textStyle}>Hi {venueName},</Text>
      
      <Text style={textStyle}>
        A WeddingRingRing event has been created for your venue.
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
        <Text style={labelStyle}>Customer</Text>
        <Text style={valueStyle}>{customerEmail}</Text>
      </div>

      {/* What's Next */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>What Happens Next:</Text>
      <Text style={{ ...textStyle, marginLeft: '20px' }}>
        1. The customer has received their login credentials<br />
        2. Phone number will be assigned 30 days before the event<br />
        3. You'll receive setup instructions when the number is ready<br />
        4. Customer can view messages in their dashboard
      </Text>

      <Button href={eventDetailsUrl} style={buttonStyle}>
        View Event Details
      </Button>

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

export default VenueNotificationEmail
