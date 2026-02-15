import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { logError, logInfo } from '@/lib/error-logging'
import { sendCustomerPhoneAssigned, sendVenuePhoneReady } from '@/lib/email-helpers'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/** How many days before the event we auto-purchase a number (via cron) */
export const PURCHASE_THRESHOLD_DAYS = 7

interface PurchaseNumberResult {
  success: boolean
  phoneNumber?: string
  phoneSid?: string
  error?: string
}

/**
 * Shared utility to purchase a Twilio number for an event.
 *
 * Used by:
 *  - Event creation API (for near-term events, i.e. within PURCHASE_THRESHOLD_DAYS)
 *  - Daily cron job (for events approaching the threshold)
 *  - Manual admin purchase endpoint
 *
 * Handles:
 *  1. Checking the event doesn't already have a number
 *  2. Searching for an available local number in the venue's country
 *  3. Purchasing the number with voice webhook configured
 *  4. Saving number details to the event record
 *  5. Rolling back (releasing number) if DB update fails
 *  6. Sending notification emails to customer and venue
 *  7. Logging success / failure
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
    // NOTE: Join to profiles via customer_id FK, and venues via venue_id FK
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
        status,
        venues!inner(id, name, primary_contact_email, country_code),
        profiles!customer_id(id, first_name, last_name, email)
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

    if (event.status === 'cancelled') {
      return {
        success: false,
        error: 'Cannot purchase number for a cancelled event'
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
      purchaseParams.bundleSid = process.env.TWILIO_REGULATORY_BUNDLE_SID
    }

    // Add address if configured (required for UK local numbers)
    if (process.env.TWILIO_ADDRESS_SID) {
      purchaseParams.addressSid = process.env.TWILIO_ADDRESS_SID
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

    // Send notification emails to customer and venue
    if (sendEmails) {
      const venue = event.venues as any
      const customer = event.profiles as any // profiles joined via customer_id

      try {
        // Build the event data shape that email helpers expect
        const emailEventData = {
          id: event.id,
          partner_1_first_name: event.partner_1_first_name,
          partner_1_last_name: event.partner_1_last_name,
          partner_2_first_name: event.partner_2_first_name,
          partner_2_last_name: event.partner_2_last_name,
          event_type: event.event_type,
          event_date: event.event_date,
          greeting_text: event.greeting_text,
          twilio_phone_number: purchased.phoneNumber,
          customer: customer ? {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email
          } : undefined,
          venue: venue ? {
            id: venue.id,
            name: venue.name,
            email: venue.primary_contact_email
          } : undefined
        }

        // Send sequentially with delay to avoid Resend rate limit (2 req/s)
        await sendCustomerPhoneAssigned(emailEventData)
        await new Promise(r => setTimeout(r, 600))
        await sendVenuePhoneReady(emailEventData)
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
