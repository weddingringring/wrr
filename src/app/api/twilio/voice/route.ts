import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const VoiceResponse = twilio.twiml.VoiceResponse

// Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    // Get the phone number that was called
    const calledNumber = params.get('To')
    const callerNumber = params.get('From')
    const callSid = params.get('CallSid')
    
    console.log(`Incoming call to ${calledNumber} from ${callerNumber}`)
    
    // Find the event for this phone number
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('twilio_phone_number', calledNumber)
      .eq('status', 'active')
      .single()
    
    if (eventError || !event) {
      console.error('Event not found for number:', calledNumber)
      
      // Return error message
      const twiml = new VoiceResponse()
      twiml.say('Sorry, this number is not currently active. Please contact the event organizer.')
      
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      })
    }
    
    // Create TwiML response
    const twiml = new VoiceResponse()
    
    // Check if custom greeting audio exists
    if (event.greeting_audio_url) {
      // Play custom uploaded greeting
      twiml.play(event.greeting_audio_url)
    } else if (event.greeting_text) {
      // Use text-to-speech for auto-generated greeting
      twiml.say({
        voice: 'Polly.Amy' // British English female voice
      }, event.greeting_text)
    } else {
      // Fallback greeting
      twiml.say({
        voice: 'Polly.Amy'
      }, 'Please leave your message after the beep.')
    }
    
    // Record the message
    const maxDuration = event.max_message_duration || 240 // Default 4 minutes
    
    twiml.record({
      maxLength: maxDuration,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
      recordingStatusCallbackEvent: ['completed'],
      recordingStatusCallbackMethod: 'POST',
      playBeep: true,
      transcribe: false, // We're not using transcription
      trim: 'trim-silence'
    })
    
    // After recording ends
    twiml.say({
      voice: 'Polly.Amy'
    }, 'Thank you for your message. Goodbye.')
    
    twiml.hangup()
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
    
  } catch (error) {
    console.error('Error in voice webhook:', error)
    
    // Return generic error message
    const twiml = new VoiceResponse()
    twiml.say('An error occurred. Please try again later.')
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
