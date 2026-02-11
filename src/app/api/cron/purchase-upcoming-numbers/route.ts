import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { logError, logCritical, logInfo } from '@/lib/error-logging'
import { sendCustomerPhoneAssigned, sendVenuePhoneReady } from '@/lib/email-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/**
 * Cron job to purchase phone numbers for upcoming events
 * Should be called daily via:
 * - Vercel Cron (vercel.json)
 * - External cron service
 * 
 * Purchases numbers for events where:
 * - Event date is 30 days away (tomorrow will be 29 days)
 * - No phone number assigned yet
 * - Status is active
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Calculate date 30 days from now
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30)
    const targetDateStr = targetDate.toISOString().split('T')[0]
    
    console.log(`Looking for events on ${targetDateStr} (30 days from now)`)
    
    // Find events needing phone numbers
    const { data: events, error: queryError } = await supabase
      .from('events')
      .select(`
        id, 
        event_date, 
        partner_1_first_name,
        partner_1_last_name,
        partner_2_first_name,
        partner_2_last_name,
        event_type,
        greeting_text,
        venues!inner(id, name, email, country_code),
        customers!inner(id, first_name, last_name, email)
      `)
      .eq('status', 'active')
      .is('twilio_phone_number', null) // No number yet
      .gte('event_date', targetDateStr) // Event date >= target
      .lt('event_date', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0]) // Event date < target + 1 day
    
    if (queryError) {
      console.error('Query error:', queryError)
      await logError('cron:purchase-numbers', queryError, { step: 'query' })
      throw queryError
    }
    
    if (!events || events.length === 0) {
      console.log('No events need phone numbers today')
      await logInfo('cron:purchase-numbers', 'No events needing numbers', {
        targetDate: targetDateStr
      })
      return NextResponse.json({ 
        success: true, 
        message: 'No events need phone numbers',
        purchased: 0
      })
    }
    
    console.log(`Found ${events.length} events needing phone numbers`)
    await logInfo('cron:purchase-numbers', `Processing ${events.length} events`, {
      targetDate: targetDateStr,
      eventCount: events.length
    })
    
    const results = {
      purchased: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Purchase number for each event
    for (const event of events) {
      try {
        const countryCode = event.venues?.country_code || 'GB'
        
        console.log(`Purchasing number for event ${event.id} (${countryCode})...`)
        
        // Search for available numbers
        const availableNumbers = await twilioClient
          .availablePhoneNumbers(countryCode)
          .local
          .list({ limit: 5 })
        
        if (!availableNumbers || availableNumbers.length === 0) {
          throw new Error(`No available numbers in ${countryCode}`)
        }
        
        // Purchase first available
        const purchased = await twilioClient.incomingPhoneNumbers.create({
          phoneNumber: availableNumbers[0].phoneNumber,
          voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
          voiceMethod: 'POST',
          statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
          statusCallbackMethod: 'POST',
          friendlyName: `WRR Event ${event.id}`
        })
        
        // Calculate release date (event_date + 37 days)
        const eventDate = new Date(event.event_date)
        const releaseDate = new Date(eventDate.getTime() + (37 * 24 * 60 * 60 * 1000))
        
        // Update event
        await supabase
          .from('events')
          .update({
            twilio_phone_number: purchased.phoneNumber,
            twilio_phone_sid: purchased.sid,
            twilio_number_purchased_at: new Date().toISOString(),
            twilio_number_release_scheduled_for: releaseDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id)
        
        results.purchased++
        console.log(`✓ Purchased ${purchased.phoneNumber} for event ${event.id}`)
        
        // Send emails to customer and venue
        try {
          await Promise.all([
            sendCustomerPhoneAssigned({
              ...event,
              twilio_phone_number: purchased.phoneNumber,
              customer: event.customers,
              venue: event.venues
            }),
            sendVenuePhoneReady({
              ...event,
              twilio_phone_number: purchased.phoneNumber,
              customer: event.customers,
              venue: event.venues
            })
          ])
          console.log(`✓ Sent notification emails for event ${event.id}`)
        } catch (emailError: any) {
          // Log email failures but don't fail the whole purchase
          console.error(`Email failed for event ${event.id}:`, emailError.message)
          await logError('cron:purchase-numbers', emailError, {
            eventId: event.id,
            phoneNumber: purchased.phoneNumber,
            errorType: 'email_notification_failed'
          }, 'warning')
        }
        
      } catch (error: any) {
        results.failed++
        const errorMsg = `Failed to purchase for event ${event.id}: ${error.message}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
        
        // Log to database with context
        await logCritical('cron:purchase-numbers', error, {
          eventId: event.id,
          countryCode: event.venues?.country_code,
          eventDate: event.event_date,
          errorType: 'purchase_failed'
        })
      }
    }
    
    console.log(`Purchase complete: ${results.purchased} purchased, ${results.failed} failed`)
    
    // Log summary
    if (results.failed > 0) {
      await logError('cron:purchase-numbers', 'Some purchases failed', {
        purchased: results.purchased,
        failed: results.failed,
        errors: results.errors
      }, 'warning')
    } else if (results.purchased > 0) {
      await logInfo('cron:purchase-numbers', 'Purchase complete', {
        purchased: results.purchased
      })
    }
    
    return NextResponse.json({ 
      success: true,
      ...results
    })
    
  } catch (error: any) {
    console.error('Error in purchase cron:', error)
    await logCritical('cron:purchase-numbers', error, {
      errorType: 'cron_failure'
    })
    return NextResponse.json({ 
      error: error.message || 'Failed to run purchase cron' 
    }, { status: 500 })
  }
}
