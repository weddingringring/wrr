import { Button, Heading, Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailLayout,
  buttonStyle,
  headingStyle,
  textStyle,
  warningBoxStyle,
} from './components/EmailLayout'

interface PasswordResetEmailProps {
  resetUrl: string
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  return (
    <EmailLayout preview="Reset your WeddingRingRing password">
      <Heading style={headingStyle}>Reset Your Password</Heading>
      
      <Text style={textStyle}>Hi,</Text>
      
      <Text style={textStyle}>
        You requested to reset your password for WeddingRingRing.
      </Text>

      <Button href={resetUrl} style={buttonStyle}>
        Reset Password
      </Button>

      <div style={warningBoxStyle}>
        <Text style={{ fontSize: '14px', margin: '0', color: '#2C2C2C' }}>
          <strong>⚠️ This link expires in 24 hours.</strong>
        </Text>
      </div>

      <Text style={textStyle}>
        If you didn't request this, you can safely ignore this email.
      </Text>

      <Text style={textStyle}>
        Need help? Contact support@weddingringring.com
      </Text>

      <Text style={textStyle}>
        The WeddingRingRing Team
      </Text>
    </EmailLayout>
  )
}

export default PasswordResetEmail
