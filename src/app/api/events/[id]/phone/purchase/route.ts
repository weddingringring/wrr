import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    
    // Check if request is from cron (using Bearer token)
    const authHeader = request.headers.get('authorization')
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    let supabase
    
    if (isCronRequest) {
      // Cron request - use service role
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    } else {
      // User request - check authentication
      const cookieStore = cookies()
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }
    
    const body = await request.json()
    const { areaCode } = body // Optional area code override
    
    // Get event details with venue country
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, twilio_phone_number, venue_id, venues!inner(country_code)')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Check if event already has a number
    if (event.twilio_phone_number) {
      return NextResponse.json({ 
        error: 'Event already has a phone number assigned',
        phone_number: event.twilio_phone_number
      }, { status: 400 })
    }
    
    // Get venue's country code (defaults to GB if not set)
    const countryCode = event.venues?.country_code || 'GB'
    
    console.log(`Purchasing number for event ${eventId} (${countryCode})...`)
    
    // Search for available numbers
    const availableNumbers = await twilioClient
      .availablePhoneNumbers(countryCode)
      .local
      .list({
        areaCode: areaCode || undefined,
        limit: 5
      })
    
    if (!availableNumbers || availableNumbers.length === 0) {
      return NextResponse.json({ 
        error: `No available phone numbers found in ${countryCode}${areaCode ? ` (area code: ${areaCode})` : ''}` 
      }, { status: 404 })
    }
    
    // Purchase the first available number
    const selectedNumber = availableNumbers[0]
    
    // Prepare purchase parameters
    const purchaseParams: any = {
      phoneNumber: selectedNumber.phoneNumber,
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
    
    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create(purchaseParams)
    
    console.log(`Purchased: ${purchasedNumber.phoneNumber} (${purchasedNumber.sid})`)
    
    // Calculate release date (event_date + 37 days)
    const { data: eventData } = await supabase
      .from('events')
      .select('event_date')
      .eq('id', eventId)
      .single()
    
    let releaseDate = null
    if (eventData?.event_date) {
      const eventDate = new Date(eventData.event_date)
      releaseDate = new Date(eventDate.getTime() + (37 * 24 * 60 * 60 * 1000))
    }
    
    // Update event with phone number
    const { error: updateError } = await supabase
      .from('events')
      .update({
        twilio_phone_number: purchasedNumber.phoneNumber,
        twilio_phone_sid: purchasedNumber.sid,
        twilio_number_purchased_at: new Date().toISOString(),
        twilio_number_release_scheduled_for: releaseDate?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Error updating event:', updateError)
      
      // Attempt to release the number since we couldn't save it
      try {
        await twilioClient.incomingPhoneNumbers(purchasedNumber.sid).remove()
      } catch (releaseError) {
        console.error('Error releasing number after failed update:', releaseError)
      }
      
      return NextResponse.json({ 
        error: 'Failed to save phone number to event' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      phone_number: purchasedNumber.phoneNumber,
      phone_sid: purchasedNumber.sid,
      country_code: countryCode,
      release_scheduled_for: releaseDate?.toISOString()
    })
    
  } catch (error: any) {
    console.error('Error purchasing phone number:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to purchase phone number' 
    }, { status: 500 })
  }
}
