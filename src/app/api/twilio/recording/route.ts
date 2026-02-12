import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError, logCritical } from '@/lib/error-logging'

// Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  let params: URLSearchParams | null = null
  
  try {
    const body = await request.text()
    params = new URLSearchParams(body)
    
    // Extract Twilio recording data
    const recordingSid = params.get('RecordingSid')
    const recordingUrl = params.get('RecordingUrl')
    const recordingDuration = params.get('RecordingDuration')
    const callSid = params.get('CallSid')
    const calledNumber = params.get('To') // The event's phone number
    const callerNumber = params.get('From') // Guest's phone number
    
    console.log(`Recording completed: ${recordingSid} (${recordingDuration}s)`)
    
    if (!recordingSid || !recordingUrl || !calledNumber) {
      console.error('Missing required recording data')
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }
    
    // Find the event for this phone number
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, customer_user_id')
      .eq('twilio_phone_number', calledNumber)
      .eq('status', 'active')
      .single()
    
    if (eventError || !event) {
      console.error('Event not found for number:', calledNumber)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Download the recording from Twilio and upload to Supabase Storage
    const twilioRecordingUrl = `${recordingUrl}.mp3`
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    
    // Fetch recording from Twilio with auth
    const response = await fetch(twilioRecordingUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download recording from Twilio')
    }
    
    const audioBuffer = await response.arrayBuffer()
    
    // Upload to Supabase Storage
    const fileName = `${event.id}/${recordingSid}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-recordings')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      throw uploadError
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('message-recordings')
      .getPublicUrl(fileName)
    
    // Create message record in database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        event_id: event.id,
        customer_user_id: event.customer_user_id,
        twilio_call_sid: callSid,
        twilio_recording_sid: recordingSid,
        audio_url: urlData.publicUrl,
        duration_seconds: parseInt(recordingDuration || '0'),
        caller_phone_number: callerNumber,
        status: 'received'
      })
      .select()
      .single()
    
    if (messageError) {
      console.error('Error creating message:', messageError)
      throw messageError
    }
    
    console.log(`Message created: ${message.id}`)
    
    // TODO: Optional - Send notification to customer (email/SMS)
    // Could trigger a separate notification service here
    
    return NextResponse.json({ 
      success: true, 
      message_id: message.id 
    })
    
  } catch (error) {
    console.error('Error in recording webhook:', error)
    
    // CRITICAL: Recording webhook failed - message will be lost!
    await logCritical('webhook:recording', error as Error, {
      recordingSid: params?.get('RecordingSid') || 'unknown',
      callSid: params?.get('CallSid') || 'unknown',
      calledNumber: params?.get('To') || 'unknown',
      callerNumber: params?.get('From') || 'unknown'
    })
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
