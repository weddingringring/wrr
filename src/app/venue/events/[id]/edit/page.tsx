'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VenueEditEventPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [hasMessages, setHasMessages] = useState(false)
  
  const [formData, setFormData] = useState({
    eventType: 'wedding',
    eventTypeOther: '',
    eventDate: '',
    venueLocation: '',
    partner1FirstName: '',
    partner1LastName: '',
    partner2FirstName: '',
    partner2LastName: '',
    customerEmail: '',
    customerPhone: '',
    age: '',
    yearsTogether: '',
    companyName: '',
    expectedGuestCount: '',
    specialRequirements: '',
    notes: ''
  })
  
  useEffect(() => {
    loadEventData()
  }, [])
  
  const loadEventData = async () => {
    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (eventError) throw eventError
      if (!eventData) throw new Error('Event not found')
      
      setEvent(eventData)
      
      // Check if event has messages (affects what can be edited)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)
      
      setHasMessages((count || 0) > 0)
      
      // Populate form
      setFormData({
        eventType: eventData.event_type || 'wedding',
        eventTypeOther: eventData.event_type_other || '',
        eventDate: eventData.event_date || '',
        venueLocation: eventData.venue_location || '',
        partner1FirstName: eventData.partner_1_first_name || '',
        partner1LastName: eventData.partner_1_last_name || '',
        partner2FirstName: eventData.partner_2_first_name || '',
        partner2LastName: eventData.partner_2_last_name || '',
        customerEmail: eventData.customer_email || '',
        customerPhone: eventData.customer_phone || '',
        age: eventData.age?.toString() || '',
        yearsTogether: eventData.years_together?.toString() || '',
        companyName: eventData.company_name || '',
        expectedGuestCount: eventData.expected_guest_count?.toString() || '',
        specialRequirements: eventData.special_requirements || '',
        notes: eventData.notes || ''
      })
      
    } catch (err: any) {
      console.error('Error loading event:', err)
      setError(err.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      // Regenerate greeting with updated names
      const firstName1 = formData.partner1FirstName
      const firstName2 = formData.partner2FirstName
      let greetingText = ''
      
      if (formData.eventType === 'wedding') {
        const names = firstName2 ? `${firstName1} and ${firstName2}` : firstName1
        greetingText = `Welcome to ${names}'s wedding. Please leave a message after the beep.`
      } else if (formData.eventType === 'birthday') {
        const age = formData.age ? `${formData.age}th ` : ''
        greetingText = `Welcome to ${firstName1}'s ${age}birthday. Please leave a message after the beep.`
      } else if (formData.eventType === 'anniversary') {
        const years = formData.yearsTogether ? `${formData.yearsTogether} year ` : ''
        const names = firstName2 ? `${firstName1} and ${firstName2}` : firstName1
        greetingText = `Welcome to ${names}'s ${years}anniversary. Please leave a message after the beep.`
      } else if (formData.eventType === 'christening') {
        greetingText = `Welcome to ${firstName1}'s christening. Please leave a message after the beep.`
      } else if (formData.eventType === 'corporate') {
        const company = formData.companyName ? `${formData.companyName} ` : ''
        greetingText = `Welcome to ${company}event. Please leave a message after the beep.`
      } else {
        const eventName = formData.eventTypeOther || formData.eventType
        greetingText = `Welcome to ${firstName1}'s ${eventName}. Please leave a message after the beep.`
      }
      
      // Update event
      const { error: updateError } = await supabase
        .from('events')
        .update({
          event_type: formData.eventType === 'other' ? 'other' : formData.eventType,
          event_type_other: formData.eventType === 'other' ? formData.eventTypeOther : null,
          event_date: formData.eventDate,
          venue_location: formData.venueLocation || null,
          partner_1_first_name: formData.partner1FirstName,
          partner_1_last_name: formData.partner1LastName,
          partner_2_first_name: formData.partner2FirstName || null,
          partner_2_last_name: formData.partner2LastName || null,
          customer_phone: formData.customerPhone || null,
          age: formData.age ? parseInt(formData.age) : null,
          years_together: formData.yearsTogether ? parseInt(formData.yearsTogether) : null,
          company_name: formData.companyName || null,
          expected_guest_count: formData.expectedGuestCount ? parseInt(formData.expectedGuestCount) : null,
          special_requirements: formData.specialRequirements || null,
          notes: formData.notes || null,
          greeting_text: greetingText,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
      
      if (updateError) throw updateError
      
      // Also update customer profile name if it changed
      const fullName = `${formData.partner1FirstName} ${formData.partner1LastName}`.trim()
      
      if (event.customer_user_id) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: formData.customerPhone
          })
          .eq('id', event.customer_user_id)
      }
      
      // Redirect to event details
      router.push(`/venue/events/${params.id}`)
      
    } catch (err: any) {
      console.error('Error updating event:', err)
      setError(err.message || 'Failed to update event')
    } finally {
      setSaving(false)
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
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/venue/events/${params.id}`} className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
            ← Back to Event Details
          </Link>
          <h1 className="font-serif text-3xl text-charcoal">Edit Event</h1>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-rose-light/50 border border-rose-light rounded-lg">
            <p className="text-sm text-rose-dark">{error}</p>
          </div>
        )}
        
        {hasMessages && (
          <div className="mb-6 p-4 bg-deep-green/10 border border-deep-green/30 rounded-lg">
            <p className="text-sm text-deep-green">
              <strong>Note:</strong> This event has received messages. The customer email cannot be changed as the account has already been created.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Event Details */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Event Details
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Event Type *
              </label>
              <select
                required
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
              >
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="christening">Christening</option>
                <option value="corporate">Corporate Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {formData.eventType === 'other' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Event Type (Other) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventTypeOther}
                  onChange={(e) => setFormData({...formData, eventTypeOther: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., Retirement Party, Baby Shower"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Venue Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.venueLocation}
                  onChange={(e) => setFormData({...formData, venueLocation: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., Garden Marquee, Ballroom"
                />
              </div>
            </div>
            
            {formData.eventType === 'birthday' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Age (Optional)
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., 30"
                />
              </div>
            )}
            
            {formData.eventType === 'anniversary' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Years Together (Optional)
                </label>
                <input
                  type="number"
                  value={formData.yearsTogether}
                  onChange={(e) => setFormData({...formData, yearsTogether: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., 25"
                />
              </div>
            )}
            
            {formData.eventType === 'corporate' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., Acme Corp"
                />
              </div>
            )}
          </div>
          
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Customer Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {formData.eventType === 'wedding' ? 'Partner 1 First Name' : 
                   formData.eventType === 'corporate' ? 'Contact First Name' : 
                   'First Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.partner1FirstName}
                  onChange={(e) => setFormData({...formData, partner1FirstName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., Sarah"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {formData.eventType === 'wedding' ? 'Partner 1 Last Name' : 
                   formData.eventType === 'corporate' ? 'Contact Last Name' : 
                   'Last Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.partner1LastName}
                  onChange={(e) => setFormData({...formData, partner1LastName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="E.g., Smith"
                />
              </div>
            </div>
            
            {(formData.eventType === 'wedding' || formData.eventType === 'anniversary') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Partner 2 First Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.partner2FirstName}
                    onChange={(e) => setFormData({...formData, partner2FirstName: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="E.g., James"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Partner 2 Last Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.partner2LastName}
                    onChange={(e) => setFormData({...formData, partner2LastName: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="E.g., Brown"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  disabled
                  className="w-full px-4 py-3 border border-sage-light rounded-lg bg-sage-light/30 text-sage-dark cursor-not-allowed"
                />
                {hasMessages ? (
                  <p className="text-xs text-sage-dark mt-1">
                    Email cannot be changed (account already created). If you need to change it, please contact support.
                  </p>
                ) : (
                  <p className="text-xs text-sage-dark mt-1">
                    Email cannot be changed. If incorrect, cancel this event and create a new one with the correct email.
                  </p>
                )}
                <p className="text-xs text-sage-dark mt-1">
                  <strong>Customer changing email?</strong> They can log in and update it themselves in Settings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="+44 7XXX XXXXXX"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Expected Guest Count (Optional)
              </label>
              <input
                type="number"
                value={formData.expectedGuestCount}
                onChange={(e) => setFormData({...formData, expectedGuestCount: e.target.value})}
                className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                placeholder="E.g., 100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Special Requirements (Optional)
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent resize-none"
                rows={3}
                placeholder="Any special requests or requirements..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent resize-none"
                rows={3}
                placeholder="Notes for venue staff only (not visible to customer)..."
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <Link
                href={`/venue/events/${params.id}`}
                className="flex-1 py-3 border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition text-center flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
            
            {!hasMessages && (
              <div className="pt-4 border-t border-sage-light">
                <p className="text-sm text-sage-dark mb-3">
                  Need to change the email address? You can cancel this event and create a new one.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this event? This cannot be undone.')) {
                      // Handle cancellation
                      router.push(`/venue/events/${params.id}/cancel`)
                    }
                  }}
                  className="px-4 py-2 text-sm border-2 border-rose text-rose rounded-lg hover:bg-rose-light/30 transition"
                >
                  Cancel Event
                </button>
              </div>
            )}
          </div>
          
        </form>
      </div>
    </div>
  )
}
