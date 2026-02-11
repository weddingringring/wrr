'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EventCreatedSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadEventDetails()
  }, [])
  
  const loadEventDetails = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*, venue:venues(name)')
        .eq('id', params.id)
        .single()
      
      if (eventData) {
        setEvent(eventData)
        setVenue(eventData.venue)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
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
  
  const getEventDisplayName = () => {
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
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="font-serif text-3xl text-charcoal">Event Created Successfully!</h1>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Success Banner */}
        <div className="bg-deep-green/10 border-2 border-deep-green rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-deep-green flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl text-charcoal mb-2">
                {getEventDisplayName()}
              </h2>
              <p className="text-sage-dark">
                Event has been created and the customer has been sent login instructions.
              </p>
            </div>
          </div>
        </div>
        
        {/* Event Details Summary */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h3 className="font-medium text-charcoal mb-4 pb-4 border-b border-sage-light">
            Event Details
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-sage-dark mb-1">Event Type</p>
              <p className="text-charcoal font-medium capitalize">{event.event_type}</p>
            </div>
            <div>
              <p className="text-sm text-sage-dark mb-1">Event Date</p>
              <p className="text-charcoal font-medium">
                {new Date(event.event_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-sage-dark mb-1">Customer Name</p>
              <p className="text-charcoal font-medium">
                {event.partner_1_first_name} {event.partner_1_last_name}
                {event.partner_2_first_name && event.partner_2_last_name && (
                  <><br />{event.partner_2_first_name} {event.partner_2_last_name}</>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-sage-dark mb-1">Customer Email</p>
              <p className="text-charcoal font-medium">{event.customer_email}</p>
            </div>
            {event.expected_guest_count && (
              <div>
                <p className="text-sm text-sage-dark mb-1">Expected Guests</p>
                <p className="text-charcoal font-medium">{event.expected_guest_count}</p>
              </div>
            )}
          </div>
          
          {event.greeting_text && (
            <div className="pt-4 border-t border-sage-light">
              <p className="text-sm text-sage-dark mb-2">Auto-Generated Greeting</p>
              <p className="text-sm text-charcoal italic bg-sage-light/20 p-4 rounded-lg">
                "{event.greeting_text}"
              </p>
            </div>
          )}
        </div>
        
        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h3 className="font-medium text-charcoal mb-4 pb-4 border-b border-sage-light">
            What Happens Next
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green/20 text-deep-green flex items-center justify-center font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-charcoal">Customer Receives Email</p>
                <p className="text-sm text-sage-dark mt-1">
                  We've sent a password reset email to <strong>{event.customer_email}</strong>. 
                  They can set their password and access their message dashboard immediately.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green/20 text-deep-green flex items-center justify-center font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-charcoal">Phone Number Will Be Assigned</p>
                <p className="text-sm text-sage-dark mt-1">
                  A unique phone number will be purchased automatically 1 month before the event date. 
                  You'll receive a notification when it's assigned, and can view it on the event details page.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green/20 text-deep-green flex items-center justify-center font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-charcoal">Event Day Setup</p>
                <p className="text-sm text-sage-dark mt-1">
                  On the event day, you'll need to program the physical phone with the assigned number. 
                  Full instructions will be available on the event details page.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Phone Setup Instructions */}
        <div className="bg-rose-light/30 border border-rose rounded-xl p-8 mb-6">
          <h3 className="font-medium text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            What You'll Need on the Event Day
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-rose">•</div>
              <p className="text-charcoal">
                <strong>The WeddingRingRing phone</strong>
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-rose">•</div>
              <p className="text-charcoal">
                <strong>The assigned phone number</strong> (will appear on event details page once assigned)
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-rose">•</div>
              <p className="text-charcoal">
                <strong>30 seconds</strong> to program the phone using our step-by-step instructions
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-rose">•</div>
              <p className="text-charcoal">
                <strong>Power source</strong> nearby (or ensure phone is fully charged)
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded-lg">
            <p className="text-xs text-sage-dark">
              <strong>💡 Pro Tip:</strong> Program the phone 30 minutes before guests arrive to allow time for testing. 
              You can call the number yourself to hear the greeting and leave a test message.
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/venue/events/${event.id}`}
            className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition text-center"
          >
            View Event Details
          </Link>
          <Link
            href={`/venue/events/${event.id}/edit`}
            className="flex-1 py-3 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition text-center"
          >
            Edit Event
          </Link>
          <Link
            href="/venue/dashboard"
            className="flex-1 py-3 border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition text-center"
          >
            Back to Dashboard
          </Link>
        </div>
        
      </div>
    </div>
  )
}
