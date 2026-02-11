import { Button, Heading, Text } from '@react-email/components'
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

interface CriticalErrorEmailProps {
  errorType: string
  errorMessage: string
  source: string
  timestamp: string
  eventId?: string
  context?: Record<string, any>
  stackTrace?: string
  dashboardUrl: string
}

export const CriticalErrorEmail = ({
  errorType,
  errorMessage,
  source,
  timestamp,
  eventId,
  context,
  stackTrace,
  dashboardUrl,
}: CriticalErrorEmailProps) => {
  return (
    <EmailLayout preview={`🚨 Critical Error - ${errorType}`}>
      <div style={{
        backgroundColor: '#DC2626',
        color: '#ffffff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <Heading style={{ ...headingStyle, color: '#ffffff', margin: '0' }}>
          🚨 Critical Error Detected
        </Heading>
      </div>

      {/* Error Details */}
      <div style={{
        ...boxStyle,
        backgroundColor: '#FEE2E2',
        borderColor: '#DC2626',
      }}>
        <Text style={labelStyle}>Error Type</Text>
        <Text style={valueStyle}>{errorType}</Text>
        
        <Text style={labelStyle}>Error Message</Text>
        <Text style={{
          ...valueStyle,
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#DC2626',
        }}>
          {errorMessage}
        </Text>
        
        <Text style={labelStyle}>Source</Text>
        <Text style={valueStyle}>{source}</Text>
        
        <Text style={labelStyle}>Timestamp</Text>
        <Text style={valueStyle}>{new Date(timestamp).toLocaleString('en-GB')}</Text>
      </div>

      {/* Context */}
      {context && Object.keys(context).length > 0 && (
        <div style={boxStyle}>
          <Text style={labelStyle}>Context</Text>
          {eventId && (
            <>
              <Text style={{ fontSize: '14px', margin: '4px 0', color: '#2C2C2C' }}>
                <strong>Event ID:</strong> {eventId}
              </Text>
            </>
          )}
          {Object.entries(context).map(([key, value]) => (
            <Text key={key} style={{ fontSize: '14px', margin: '4px 0', color: '#2C2C2C' }}>
              <strong>{key}:</strong> {String(value)}
            </Text>
          ))}
        </div>
      )}

      <Button href={dashboardUrl} style={{
        ...buttonStyle,
        backgroundColor: '#DC2626',
      }}>
        View Error in Dashboard
      </Button>

      {/* Stack Trace */}
      {stackTrace && (
        <div style={boxStyle}>
          <Text style={labelStyle}>Stack Trace</Text>
          <Text style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#2C2C2C',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            margin: '8px 0 0',
          }}>
            {stackTrace}
          </Text>
        </div>
      )}

      <Text style={textStyle}>
        This is an automated alert from the error logging system.
      </Text>

      <Text style={{ fontSize: '12px', color: '#6B8E5C', margin: '16px 0 0' }}>
        WeddingRingRing Error Monitoring System
      </Text>
    </EmailLayout>
  )
}

export default CriticalErrorEmail
