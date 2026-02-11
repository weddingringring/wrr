import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { logError, logCritical, logInfo } from '@/lib/error-logging'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/**
 * Cron job to release phone numbers for completed events
 * Should be called daily via:
 * - Vercel Cron (vercel.json)
 * - External cron service (cron-job.org)
 * - Manual admin trigger
 * 
 * Releases numbers for events where:
 * - Event date + 37 days has passed
 * - Number hasn't been released yet
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (basic security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const today = new Date().toISOString()
    
    // Find events ready for number release
    const { data: events, error: queryError } = await supabase
      .from('events')
      .select('id, twilio_phone_number, twilio_phone_sid, twilio_number_release_scheduled_for')
      .not('twilio_phone_number', 'is', null) // Has a number
      .is('twilio_number_released_at', null) // Not yet released
      .lte('twilio_number_release_scheduled_for', today) // Past release date
    
    if (queryError) {
      console.error('Query error:', queryError)
      throw queryError
    }
    
    if (!events || events.length === 0) {
      console.log('No phone numbers to release')
      return NextResponse.json({ 
        success: true, 
        message: 'No phone numbers to release',
        released: 0
      })
    }
    
    console.log(`Found ${events.length} phone numbers to release`)
    
    const results = {
      released: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Release each number
    for (const event of events) {
      try {
        console.log(`Releasing ${event.twilio_phone_number} for event ${event.id}`)
        
        // Release from Twilio
        await twilioClient
          .incomingPhoneNumbers(event.twilio_phone_sid)
          .remove()
        
        // Update database
        await supabase
          .from('events')
          .update({
            twilio_number_released_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id)
        
        results.released++
        console.log(`✓ Released ${event.twilio_phone_number}`)
        
      } catch (error: any) {
        results.failed++
        const errorMsg = `Failed to release ${event.twilio_phone_number}: ${error.message}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
        
        // Log to database
        await logError('cron:cleanup-phones', error, {
          eventId: event.id,
          phoneNumber: event.twilio_phone_number,
          phoneSid: event.twilio_phone_sid,
          errorType: 'release_failed'
        })
        
        // Continue with other numbers even if one fails
      }
    }
    
    console.log(`Cleanup complete: ${results.released} released, ${results.failed} failed`)
    
    return NextResponse.json({ 
      success: true,
      ...results
    })
    
  } catch (error: any) {
    console.error('Error in phone cleanup cron:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to run cleanup' 
    }, { status: 500 })
  }
}
