'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_first_name: string
  partner_1_last_name: string
  partner_2_first_name: string | null
  partner_2_last_name: string | null
  twilio_phone_number: string | null
  greeting_text: string
  greeting_audio_url: string | null
  status: string
}

export default function VenueEventSetupPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    loadEvent()
  }, [])
  
  const loadEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/venue/login')
        return
      }
      
      // Get venue
      const { data: venueData } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      
      if (!venueData) return
      
      // Get event
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .eq('venue_id', venueData.id)
        .single()
      
      if (error) throw error
      
      setEvent(data)
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const copyPhoneNumber = () => {
    if (event?.twilio_phone_number) {
      navigator.clipboard.writeText(event.twilio_phone_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const getEventDisplayName = () => {
    if (!event) return ''
    
    const first1 = event.partner_1_first_name
    const last1 = event.partner_1_last_name
    const first2 = event.partner_2_first_name
    const last2 = event.partner_2_last_name
    
    if (event.event_type === 'wedding') {
      return first2 && last2 
        ? `${first1} ${last1} & ${first2} ${last2}'s Wedding`
        : `${first1} ${last1}'s Wedding`
    }
    return `${first1} ${last1}'s ${event.event_type}`
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal mb-4">Event not found</p>
          <Link href="/venue/dashboard" className="text-deep-green hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/venue/events/${event.id}`} className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
            ← Back to Event Details
          </Link>
          <h1 className="font-serif text-3xl text-charcoal">Event Day Setup</h1>
          <p className="text-sage-dark mt-1">{getEventDisplayName()}</p>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Phone Number Alert */}
        {!event.twilio_phone_number ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Phone Number Not Yet Assigned</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  The phone number will be assigned automatically 30 days before the event. 
                  Check back closer to the event date for setup instructions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Phone Number Display */}
            <div className="bg-deep-green text-white rounded-xl shadow-lg p-8 mb-8 text-center">
              <p className="text-sm uppercase tracking-wide mb-2 opacity-90">Your Event Phone Number</p>
              <div className="flex items-center justify-center gap-4">
                <p className="font-serif text-4xl">{event.twilio_phone_number}</p>
                <button
                  onClick={copyPhoneNumber}
                  className="px-4 py-2 bg-white text-deep-green rounded-lg text-sm font-medium hover:bg-cream transition"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            {/* Quick Checklist */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
              <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
                Quick Checklist
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal">WeddingRingRing phone is charged and turned on</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal">Phone number programmed (see instructions below)</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal">Test call completed successfully</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal">Phone placed in visible, accessible location</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal">Power source nearby or phone fully charged</span>
                </div>
              </div>
            </div>
            
            {/* Step-by-Step Instructions */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
              <h2 className="font-serif text-2xl text-charcoal mb-6 pb-4 border-b border-sage-light">
                Setup Instructions
              </h2>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-sm text-charcoal">
                  <strong>Note:</strong> The WeddingRingRing phone has no screen. All setup is done by dialing special codes using the rotary dial or push buttons.
                </p>
              </div>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center font-serif text-xl">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-charcoal text-lg mb-2">Turn On & Keep Plugged In</h3>
                    <p className="text-sage-dark mb-3">
                      Slide the switch on the bottom of the phone from <strong>0</strong> to <strong>I</strong> (on position). 
                      Keep the phone plugged into the charger throughout the event.
                    </p>
                    <div className="bg-sage-light/30 rounded-lg p-4">
                      <p className="text-sm text-charcoal">
                        <strong>💡 Tip:</strong> Wait 30 seconds after turning on. The phone is ready when you pick up the handset and hear a dial tone (continuous "toot" sound). We recommend leaving it plugged in to avoid any battery issues during the event.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center font-serif text-xl">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-charcoal text-lg mb-2">Program the Event Number</h3>
                    <p className="text-sage-dark mb-3">
                      Pick up the handset, wait for the dial tone, then dial this code:
                    </p>
                    <div className="bg-sage-light/30 rounded-lg p-4 mb-3">
                      <p className="font-mono text-lg text-deep-green font-bold text-center">
                        *02#1#{event.twilio_phone_number}*
                      </p>
                      <p className="text-xs text-center text-sage-dark mt-2">
                        ⚠️ This code is unique to this event - different for each wedding/event you host
                      </p>
                    </div>
                    <p className="text-charcoal text-sm mb-2">
                      <strong>For rotary phones:</strong> Dial each number by rotating the dial to the number, then releasing. 
                      For * (star), dial to 0 and hold briefly.
                    </p>
                    <p className="text-charcoal text-sm mb-3">
                      <strong>For push-button phones:</strong> Simply press each button including the * and # keys.
                    </p>
                    <div className="bg-rose-light/30 rounded-lg p-4">
                      <p className="text-sm text-charcoal">
                        <strong>✓ Success:</strong> The phone will ring once if the number is saved correctly.
                        <br />
                        <strong>✗ Error:</strong> The phone rings twice if there was a mistake - just try again.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center font-serif text-xl">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-charcoal text-lg mb-2">Test the Setup</h3>
                    <p className="text-sage-dark mb-3">
                      Pick up the handset and dial: <strong className="font-mono text-deep-green">1</strong>
                    </p>
                    <p className="text-charcoal text-sm mb-3">
                      You should hear the greeting: <em>"{event.greeting_text}"</em> followed by a beep.
                    </p>
                    <div className="bg-sage-light/30 rounded-lg p-4">
                      <p className="text-sm text-charcoal">
                        <strong>💡 Best Practice:</strong> Leave a test message like "Testing 1-2-3" and check it appears 
                        in the customer's dashboard. Delete it afterward.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Step 4 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center font-serif text-xl">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-charcoal text-lg mb-2">Position the Phone</h3>
                    <p className="text-sage-dark mb-3">
                      Place the phone somewhere visible and accessible for guests:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-charcoal ml-4">
                      <li>Near the guest book or card table</li>
                      <li>At the entrance or reception area</li>
                      <li>With a clear sign: "Pick up and press 1 to leave a message"</li>
                    </ul>
                  </div>
                </div>
                
                {/* Step 5 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center font-serif text-xl">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-charcoal text-lg mb-2">Guest Instructions</h3>
                    <p className="text-sage-dark mb-3">
                      Guests simply need to:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-charcoal ml-4 mb-3">
                      <li>Pick up the handset</li>
                      <li>Press or dial <strong className="font-mono text-deep-green">1</strong></li>
                      <li>Wait for the greeting and beep</li>
                      <li>Leave their message (up to 4 minutes)</li>
                      <li>Hang up when done</li>
                    </ol>
                    <div className="bg-sage-light/30 rounded-lg p-4">
                      <p className="text-sm text-charcoal">
                        <strong>💡 Tip:</strong> Create a simple sign that says: <em>"Pick up phone, press 1, leave your message!"</em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Troubleshooting */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
              <h2 className="font-serif text-2xl text-charcoal mb-6 pb-4 border-b border-sage-light">
                Troubleshooting
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-charcoal mb-2">❌ Phone rang twice when programming</h3>
                  <p className="text-sage-dark text-sm">
                    This means there was an error. Try again, making sure to dial the exact sequence: 
                    <code className="bg-sage-light/30 px-2 py-1 rounded font-mono text-deep-green">*02#1#{event.twilio_phone_number}*</code>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-charcoal mb-2">❌ No dial tone when handset is picked up</h3>
                  <p className="text-sage-dark text-sm">
                    Wait 30 seconds after turning on the phone. If still no dial tone, check:
                    (1) Phone is switched to "I" position, 
                    (2) SIM card is inserted correctly, 
                    (3) Check the status lights on the bottom of the phone.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-charcoal mb-2">❌ Pressing 1 doesn't connect / hear greeting</h3>
                  <p className="text-sage-dark text-sm">
                    The number might not be programmed yet. Repeat Step 2. Make sure you hear one ring (success) 
                    after dialing the programming code.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-charcoal mb-2">❌ Greeting is wrong or unclear</h3>
                  <p className="text-sage-dark text-sm">
                    Current greeting: "{event.greeting_text}". If incorrect, contact the customer to update it, 
                    or contact WeddingRingRing support for urgent changes.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-charcoal mb-2">❌ Messages aren't being recorded</h3>
                  <p className="text-sage-dark text-sm">
                    Check that guests are waiting for the beep before speaking. Recording automatically stops 
                    after 4 minutes or when the handset is hung up.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Support */}
            <div className="bg-rose-light/30 border-l-4 border-rose rounded-lg p-6">
              <h3 className="font-medium text-charcoal mb-2">Need Help?</h3>
              <p className="text-charcoal text-sm mb-3">
                If you encounter any issues on the event day, contact WeddingRingRing support:
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-charcoal">
                  📧 Email: <strong className="text-deep-green">support@weddingringring.com</strong>
                </p>
                <p className="text-charcoal">
                  📱 Phone: <strong className="text-deep-green">+44 20 XXXX XXXX</strong> (Event day hotline)
                </p>
              </div>
            </div>
          </>
        )}
        
        {/* Back Button */}
        <div className="mt-8">
          <Link
            href={`/venue/events/${event.id}`}
            className="inline-block px-6 py-3 bg-white border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition"
          >
            ← Back to Event Details
          </Link>
        </div>
      </div>
    </div>
  )
}
