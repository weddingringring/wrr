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

interface DayAfterSummaryEmailProps {
  customerFirstName: string
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName?: string
  partner2LastName?: string
  eventType: string
  eventDate: string
  phoneNumber: string
  messageCount: number
  dashboardUrl: string
  numberExpiryDate: string
}

export const DayAfterSummaryEmail = ({
  customerFirstName,
  partner1FirstName,
  partner1LastName,
  partner2FirstName,
  partner2LastName,
  eventType,
  eventDate,
  phoneNumber,
  messageCount,
  dashboardUrl,
  numberExpiryDate,
}: DayAfterSummaryEmailProps) => {
  const eventName = partner2FirstName && partner2LastName
    ? `${partner1FirstName} ${partner1LastName} & ${partner2FirstName} ${partner2LastName}`
    : `${partner1FirstName} ${partner1LastName}`

  // Determine greeting based on event type
  const getGreeting = () => {
    switch (eventType.toLowerCase()) {
      case 'wedding':
        return 'Congratulations on your wedding! 🎉'
      case 'birthday':
        return 'Hope you had an amazing birthday! 🎂'
      case 'anniversary':
        return 'Happy anniversary! 💕'
      default:
        return `Hope you had an amazing ${eventType}! 🎉`
    }
  }

  return (
    <EmailLayout preview={`${messageCount} messages from your ${eventType}!`}>
      <Heading style={headingStyle}>{getGreeting()}</Heading>
      
      <Text style={textStyle}>Hi {customerFirstName},</Text>

      {/* Message Count */}
      {messageCount > 0 ? (
        <>
          <div style={{
            ...boxStyle,
            backgroundColor: '#2D5016',
            borderColor: '#2D5016',
            textAlign: 'center',
          }}>
            <Text style={{ ...labelStyle, color: '#C5D5B8' }}>
              Your Audio Guestbook Messages
            </Text>
            <Text style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '8px 0',
            }}>
              {messageCount}
            </Text>
            <Text style={{ fontSize: '18px', color: '#C5D5B8', margin: '0' }}>
              {messageCount === 1 ? 'message' : 'messages'} from your guests
            </Text>
          </div>

          <Button href={dashboardUrl} style={buttonStyle}>
            Listen to Your Messages
          </Button>
        </>
      ) : (
        <>
          <div style={warningBoxStyle}>
            <Text style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#2C2C2C' }}>
              Your Audio Guestbook Messages
            </Text>
            <Text style={{ fontSize: '16px', margin: '0', color: '#2C2C2C' }}>
              No messages yet - but don't worry!
            </Text>
          </div>

          <Text style={textStyle}>
            Your audio guestbook will remain active for another 30 days.
          </Text>

          <Text style={{ ...labelStyle, marginTop: '24px' }}>What This Means:</Text>
          <Text style={{ ...textStyle, marginLeft: '20px' }}>
            • The phone may have experienced technical issues<br />
            • Guests may have been hesitant or missed it<br />
            • Friends and family can still call to leave messages<br />
            • Share the number with loved ones who couldn't attend
          </Text>
        </>
      )}

      {/* Phone Number Still Active */}
      <div style={boxStyle}>
        <Text style={labelStyle}>
          Audio Guestbook Number (Active until {new Date(numberExpiryDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })})
        </Text>
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

      {/* What's Next */}
      <Text style={{ ...labelStyle, marginTop: '24px' }}>What's Next?</Text>
      <Text style={{ ...textStyle, marginLeft: '20px' }}>
        • Your audio guestbook remains active for another 30 days<br />
        • Friends and family can still call to leave more messages<br />
        • Listen, download, and share your messages anytime<br />
        • Messages are yours to keep forever
      </Text>

      {messageCount === 0 && (
        <Button href={dashboardUrl} style={buttonStyle}>
          View Your Dashboard
        </Button>
      )}

      <Text style={textStyle}>
        Share this number with anyone who missed the event!
      </Text>

      <Text style={textStyle}>
        {messageCount > 0 ? 'Reliving the memories,' : 'Wishing you well,'}<br />
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default DayAfterSummaryEmail
