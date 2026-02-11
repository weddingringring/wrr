'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_name: string
  partner_2_name: string | null
  customer_email: string
  customer_phone: string
  expected_guest_count: number
  twilio_phone_number: string
  status: string
  notes: string
  greeting_audio_url: string | null
  messages_count: number
}

export default function VenueEventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
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
        .select(`
          *,
          messages:messages(count)
        `)
        .eq('id', params.id)
        .eq('venue_id', venueData.id)
        .single()
      
      if (error) throw error
      
      setEvent({
        ...data,
        messages_count: data.messages[0]?.count || 0
      })
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
    
    if (event.event_type === 'wedding') {
      return event.partner_2_name 
        ? `${event.partner_1_name} & ${event.partner_2_name}'s Wedding`
        : `${event.partner_1_name}'s Wedding`
    }
    return `${event.partner_1_name}'s ${event.event_type}`
  }
  
  const getDaysUntil = () => {
    if (!event) return 0
    return Math.ceil(
      (new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  }
  
  const canEdit = () => {
    if (!event) return false
    return new Date(event.event_date) >= new Date() && event.status === 'active'
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading event...</p>
        </div>
      </div>
    )
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-sage-dark mb-4">Event not found</p>
          <Link
            href="/venue/dashboard"
            className="text-deep-green hover:text-deep-green-dark font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  const daysUntil = getDaysUntil()
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/venue/dashboard" className="inline-block hover:opacity-80 transition">
              <h1 className="font-serif text-2xl text-deep-green">WeddingRingRing</h1>
              <p className="text-xs text-sage-dark">← Back to Dashboard</p>
            </Link>
            
            {canEdit() && (
              <Link
                href={`/venue/events/${event.id}/edit`}
                className="px-4 py-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
              >
                Edit Event
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-serif text-3xl text-charcoal mb-2">
                {getEventDisplayName()}
              </h2>
              <p className="text-lg text-sage-dark">
                {new Date(event.event_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              event.status === 'active'
                ? 'bg-deep-green/10 text-deep-green'
                : event.status === 'completed'
                ? 'bg-sage/10 text-sage-dark'
                : 'bg-rose/10 text-rose-dark'
            }`}>
              {event.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-sage-dark mb-1">Customer Email</p>
              <p className="text-charcoal font-medium">{event.customer_email}</p>
            </div>
            
            {event.customer_phone && (
              <div>
                <p className="text-sm text-sage-dark mb-1">Customer Phone</p>
                <p className="text-charcoal font-medium">{event.customer_phone}</p>
              </div>
            )}
            
            {event.expected_guest_count && (
              <div>
                <p className="text-sm text-sage-dark mb-1">Expected Guests</p>
                <p className="text-charcoal font-medium">{event.expected_guest_count} guests</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-sage-dark mb-1">Event Type</p>
              <p className="text-charcoal font-medium capitalize">{event.event_type}</p>
            </div>
          </div>
          
          {/* Phone Programming Instructions */}
          <div className="bg-deep-green/5 border-2 border-deep-green/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-sage-dark mb-2">Unique Event Phone Number</p>
                <p className="text-2xl font-mono font-bold text-deep-green">
                  {event.twilio_phone_number || 'Number not assigned yet'}
                </p>
              </div>
              {event.twilio_phone_number && (
                <button
                  onClick={copyPhoneNumber}
                  className="px-4 py-2 bg-white border border-sage-light rounded-lg text-sm hover:bg-sage-light/30 transition"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>
            
            {event.twilio_phone_number && (
              <>
                <div className="mb-4">
                  <Link
                    href={`/venue/events/${event.id}/setup`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Event Day Setup Instructions
                  </Link>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-sage-light">
                  <p className="text-sm font-medium text-charcoal mb-3">📱 Quick Setup (No screen required):</p>
                  <ol className="space-y-2 text-sm text-charcoal">
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-deep-green text-white text-xs font-bold mr-3 flex-shrink-0">1</span>
                      <span>Turn on phone: Slide switch from <strong>0</strong> to <strong>I</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-deep-green text-white text-xs font-bold mr-3 flex-shrink-0">2</span>
                      <span>Pick up handset, wait for dial tone, then dial: <code className="bg-sage-light/30 px-2 py-0.5 rounded font-mono text-deep-green">*02#1#{event.twilio_phone_number}*</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-deep-green text-white text-xs font-bold mr-3 flex-shrink-0">3</span>
                      <span><strong>Phone rings once</strong> = Success! Number is saved</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-deep-green text-white text-xs font-bold mr-3 flex-shrink-0">4</span>
                      <span><strong>Test:</strong> Pick up handset, dial <strong className="font-mono">*1</strong> - you should hear the greeting</span>
                    </li>
                  </ol>
                  
                  <div className="mt-3 pt-3 border-t border-sage-light">
                    <p className="text-xs text-sage-dark">
                      💡 <strong>For guests:</strong> They simply pick up and press <strong>1</strong> to leave a message (up to 4 minutes).
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 bg-rose-light/30 border border-rose-light rounded-lg p-3">
                  <p className="text-sm text-charcoal">
                    💡 <strong>Tip:</strong> Remote guests can also call <span className="font-mono text-deep-green">{event.twilio_phone_number}</span> directly from their own phones to leave messages!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {daysUntil >= 0 && event.status === 'active' && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-sm text-sage-dark mb-1">Days Until Event</p>
              <p className="text-3xl font-bold text-deep-green">{daysUntil}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-sm text-sage-dark mb-1">Messages Received</p>
            <p className="text-3xl font-bold text-charcoal">{event.messages_count}</p>
            <p className="text-xs text-sage-dark mt-1">Updates in real-time</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-sm text-sage-dark mb-1">Greeting Status</p>
            <p className="text-lg font-medium text-deep-green mt-2">
              {event.greeting_audio_url ? '✓ Uploaded' : '⏳ Pending'}
            </p>
          </div>
        </div>
        
        {/* Notes Section */}
        {event.notes && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-serif text-xl text-charcoal mb-4">Notes & Requirements</h3>
            <div className="bg-sage-light/10 rounded-lg p-4">
              <p className="text-charcoal whitespace-pre-wrap">{event.notes}</p>
            </div>
          </div>
        )}
        
        {/* Actions */}
        {canEdit() && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-serif text-xl text-charcoal mb-4">Actions</h3>
            
            <div className="space-y-3">
              <Link
                href={`/venue/events/${event.id}/edit`}
                className="block w-full px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition text-center"
              >
                Edit Event Details
              </Link>
            </div>
          </div>
        )}
        
        {/* Info Box */}
        <div className="mt-6 bg-sage-light/20 border border-sage-light rounded-lg p-4">
          <p className="text-sm text-sage-dark">
            <strong>Note:</strong> You can view the event details and message count, but only customers can listen to their messages. 
            They access their dashboard at weddingringring.com with their email and password.
          </p>
        </div>
      </div>
    </div>
  )
}
