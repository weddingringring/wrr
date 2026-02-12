import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Running phone number cleanup cron job...')
    
    // Find events that need phone numbers released
    // Criteria: Event date + 37 days has passed, number not yet released
    const releaseDate = new Date()
    releaseDate.setDate(releaseDate.getDate() - 37) // 37 days ago
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, twilio_phone_number, twilio_phone_sid, event_date')
      .lt('event_date', releaseDate.toISOString().split('T')[0])
      .not('twilio_phone_sid', 'is', null)
      .is('twilio_number_released_at', null)
      .limit(50) // Process in batches
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    if (!events || events.length === 0) {
      console.log('No phone numbers to release')
      return NextResponse.json({ 
        success: true, 
        message: 'No numbers to release',
        released: 0
      })
    }
    
    console.log(`Found ${events.length} numbers to release`)
    
    const results = {
      released: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Release each number
    for (const event of events) {
      try {
        console.log(`Releasing ${event.twilio_phone_number} for event ${event.id}`)
        
        // Release in Twilio
        await twilioClient.incomingPhoneNumbers(event.twilio_phone_sid).remove()
        
        // Update database
        await supabase
          .from('events')
          .update({
            twilio_number_released_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id)
        
        results.released++
        
      } catch (error: any) {
        console.error(`Failed to release ${event.twilio_phone_number}:`, error)
        results.failed++
        results.errors.push(`${event.twilio_phone_number}: ${error.message}`)
      }
    }
    
    console.log(`Cleanup complete: ${results.released} released, ${results.failed} failed`)
    
    return NextResponse.json({ 
      success: true,
      ...results
    })
    
  } catch (error: any) {
    console.error('Error in cleanup cron:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
