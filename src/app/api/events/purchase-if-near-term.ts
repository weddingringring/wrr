import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { logError, logInfo } from '@/lib/error-logging'
import { sendCustomerPhoneAssigned, sendVenuePhoneReady } from '@/lib/email-helpers'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

interface PurchaseNumberResult {
  success: boolean
  phoneNumber?: string
  phoneSid?: string
  error?: string
}

/**
 * Shared utility to purchase a Twilio number for an event
 * Used by:
 * - Event creation (for near-term events)
 * - Cron job (for events 30 days out)
 * - Manual admin purchase
 */
export async function purchaseTwilioNumber(
  eventId: string,
  countryCode: string = 'GB',
  sendEmails: boolean = true
): Promise<PurchaseNumberResult> {
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    console.log(`Purchasing number for event ${eventId} (${countryCode})...`)
    
    // Get event details first to check if it already has a number
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        event_date,
        twilio_phone_number,
        partner_1_first_name,
        partner_1_last_name,
        partner_2_first_name,
        partner_2_last_name,
        event_type,
        greeting_text,
        venues!inner(id, name, email, country_code),
        customers!inner(id, first_name, last_name, email)
      `)
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      throw new Error(`Event not found: ${eventId}`)
    }
    
    // Check if event already has a number
    if (event.twilio_phone_number) {
      return {
        success: false,
        error: 'Event already has a phone number assigned',
        phoneNumber: event.twilio_phone_number
      }
    }
    
    // Search for available numbers
    const availableNumbers = await twilioClient
      .availablePhoneNumbers(countryCode)
      .local
      .list({ limit: 5 })
    
    if (!availableNumbers || availableNumbers.length === 0) {
      throw new Error(`No available numbers in ${countryCode}`)
    }
    
    // Prepare purchase parameters
    const purchaseParams: any = {
      phoneNumber: availableNumbers[0].phoneNumber,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      voiceMethod: 'POST',
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
      statusCallbackMethod: 'POST',
      friendlyName: `WRR Event ${eventId}`
    }
    
    // Add regulatory bundle if configured (required for UK and many countries)
    if (process.env.TWILIO_REGULATORY_BUNDLE_SID) {
      purchaseParams.addressSid = process.env.TWILIO_REGULATORY_BUNDLE_SID
    }
    
    // Purchase number
    const purchased = await twilioClient.incomingPhoneNumbers.create(purchaseParams)
    
    console.log(`✓ Purchased ${purchased.phoneNumber} for event ${eventId}`)
    
    // Calculate release date (event_date + 37 days)
    const eventDate = new Date(event.event_date)
    const releaseDate = new Date(eventDate.getTime() + (37 * 24 * 60 * 60 * 1000))
    
    // Update event with phone number
    const { error: updateError } = await supabase
      .from('events')
      .update({
        twilio_phone_number: purchased.phoneNumber,
        twilio_phone_sid: purchased.sid,
        twilio_number_purchased_at: new Date().toISOString(),
        twilio_number_release_scheduled_for: releaseDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Error updating event:', updateError)
      
      // Attempt to release the number since we couldn't save it
      try {
        await twilioClient.incomingPhoneNumbers(purchased.sid).remove()
      } catch (releaseError) {
        console.error('Error releasing number after failed update:', releaseError)
      }
      
      throw new Error('Failed to save phone number to event')
    }
    
    // Send notification emails
    if (sendEmails) {
      const venue = event.venues as any
      const customer = event.customers as any
      
      try {
        await Promise.all([
          sendCustomerPhoneAssigned({
            ...event,
            twilio_phone_number: purchased.phoneNumber,
            customer: customer,
            venue: venue
          }),
          sendVenuePhoneReady({
            ...event,
            twilio_phone_number: purchased.phoneNumber,
            customer: customer,
            venue: venue
          })
        ])
        console.log(`✓ Sent notification emails for event ${eventId}`)
      } catch (emailError: any) {
        // Log email failures but don't fail the whole purchase
        console.error(`Email failed for event ${eventId}:`, emailError.message)
        await logError('phone-purchase', emailError, {
          eventId: eventId,
          phoneNumber: purchased.phoneNumber,
          errorType: 'email_notification_failed'
        }, 'warning')
      }
    }
    
    await logInfo('phone-purchase', 'Number purchased successfully', {
      eventId: eventId,
      phoneNumber: purchased.phoneNumber,
      countryCode: countryCode
    })
    
    return {
      success: true,
      phoneNumber: purchased.phoneNumber,
      phoneSid: purchased.sid
    }
    
  } catch (error: any) {
    console.error(`Failed to purchase number for event ${eventId}:`, error)
    
    await logError('phone-purchase', error, {
      eventId: eventId,
      countryCode: countryCode,
      errorType: 'purchase_failed'
    })
    
    return {
      success: false,
      error: error.message || 'Failed to purchase phone number'
    }
  }
}

/**
 * Calculate days until event
 */
export function daysUntilEvent(eventDate: string): number {
  const event = new Date(eventDate)
  const now = new Date()
  const diffTime = event.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
