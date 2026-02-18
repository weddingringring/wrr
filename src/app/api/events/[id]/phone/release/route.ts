import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    } else {
      // User request - check authentication
      supabase = await createClient()
      
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
      
      if (profile?.role !== 'admin' && profile?.role !== 'developer') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }
    
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, twilio_phone_number, twilio_phone_sid')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Check if event has a phone number
    if (!event.twilio_phone_number || !event.twilio_phone_sid) {
      return NextResponse.json({ 
        error: 'Event does not have a phone number assigned' 
      }, { status: 400 })
    }
    
    console.log(`Releasing number ${event.twilio_phone_number} for event ${eventId}...`)
    
    // Release the number from Twilio
    try {
      await twilioClient
        .incomingPhoneNumbers(event.twilio_phone_sid)
        .remove()
      
      console.log(`Released: ${event.twilio_phone_number}`)
    } catch (twilioError: any) {
      console.error('Twilio release error:', twilioError)
      
      // If number doesn't exist in Twilio (already released), continue
      if (twilioError.code !== 20404) {
        throw twilioError
      }
    }
    
    // Update event to mark number as released
    const { error: updateError } = await supabase
      .from('events')
      .update({
        twilio_number_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json({ 
        error: 'Phone number released from Twilio but failed to update database' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Phone number released successfully'
    })
    
  } catch (error: any) {
    console.error('Error releasing phone number:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to release phone number' 
    }, { status: 500 })
  }
}
