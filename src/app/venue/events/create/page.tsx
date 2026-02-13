'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VenueCreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    // Event Details
    eventType: 'wedding',
    eventTypeOther: '',
    eventDate: '',
    venueLocation: '',
    
    // Customer Info
    partner1FirstName: '',
    partner1LastName: '',
    partner2FirstName: '',
    partner2LastName: '',
    customerEmail: '',
    customerPhone: '',
    
    // Event-specific fields
    age: '',
    yearsTogether: '',
    companyName: '',
    
    // Additional
    expectedGuestCount: '',
    specialRequirements: '',
    notes: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Get current venue user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Get venue ID and country code
      const { data: venueData } = await supabase
        .from('venues')
        .select('id, country_code')
        .eq('owner_id', user.id)
        .single()
      
      if (!venueData) throw new Error('Venue not found')
      
      // Step 1: Create customer auth account
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
      const fullName = `${formData.partner1FirstName} ${formData.partner1LastName}`.trim()
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.customerEmail,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          role: 'customer'
        }
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create customer account')
      
      // Step 2: Create customer profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.customerEmail,
          full_name: fullName,
          phone: formData.customerPhone,
          role: 'customer'
        })
      
      if (profileError) throw profileError
      
      // Step 3: Auto-generate greeting (always)
      let greetingText = ''
      const firstName1 = formData.partner1FirstName
      const firstName2 = formData.partner2FirstName
      
      if (formData.eventType === 'wedding') {
        const names = firstName2 
          ? `${firstName1} and ${firstName2}`
          : firstName1
        greetingText = `Welcome to ${names}'s wedding. Please leave a message after the beep.`
      } else if (formData.eventType === 'birthday') {
        const age = formData.age ? `${formData.age}th ` : ''
        greetingText = `Welcome to ${firstName1}'s ${age}birthday. Please leave a message after the beep.`
      } else if (formData.eventType === 'anniversary') {
        const years = formData.yearsTogether ? `${formData.yearsTogether} year ` : ''
        const names = firstName2 
          ? `${firstName1} and ${firstName2}`
          : firstName1
        greetingText = `Welcome to ${names}'s ${years}anniversary. Please leave a message after the beep.`
      } else if (formData.eventType === 'christening') {
        greetingText = `Welcome to ${firstName1}'s christening. Please leave a message after the beep.`
      } else if (formData.eventType === 'corporate') {
        const company = formData.companyName ? `${formData.companyName} ` : ''
        greetingText = `Welcome to ${company}event. Please leave a message after the beep.`
      } else {
        // 'other' or fallback
        const eventName = formData.eventTypeOther || formData.eventType
        greetingText = `Welcome to ${firstName1}'s ${eventName}. Please leave a message after the beep.`
      }
      
      // Step 4: Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          venue_id: venueData.id,
          customer_user_id: authData.user.id,
          event_type: formData.eventType === 'other' ? 'other' : formData.eventType,
          event_type_other: formData.eventType === 'other' ? formData.eventTypeOther : null,
          event_date: formData.eventDate,
          venue_location: formData.venueLocation || null,
          partner_1_first_name: formData.partner1FirstName,
          partner_1_last_name: formData.partner1LastName,
          partner_2_first_name: formData.partner2FirstName || null,
          partner_2_last_name: formData.partner2LastName || null,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone || null,
          age: formData.age ? parseInt(formData.age) : null,
          years_together: formData.yearsTogether ? parseInt(formData.yearsTogether) : null,
          company_name: formData.companyName || null,
          expected_guest_count: formData.expectedGuestCount ? parseInt(formData.expectedGuestCount) : null,
          special_requirements: formData.specialRequirements || null,
          notes: formData.notes || null,
          greeting_text: greetingText || null,
          status: 'active'
        })
        .select()
        .single()
      
      if (eventError) throw eventError
      
      // Step 5: Purchase phone number if event is less than 30 days away
      // Events 30+ days away will be handled by daily cron job
      try {
        const purchaseResponse = await fetch('/api/events/purchase-if-near-term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            eventDate: formData.eventDate,
            countryCode: venueData.country_code || 'GB'
          })
        })
        
        const purchaseResult = await purchaseResponse.json()
        
        if (purchaseResult.success && purchaseResult.phoneNumber) {
          console.log(`✓ Phone number purchased: ${purchaseResult.phoneNumber}`)
        } else if (purchaseResult.daysUntilEvent >= 30) {
          console.log(`Event is ${purchaseResult.daysUntilEvent} days away - number will be purchased by cron`)
        } else {
          console.warn('Phone purchase failed (non-critical):', purchaseResult.error)
        }
      } catch (purchaseError) {
        // Non-critical error - log but don't fail event creation
        console.error('Phone purchase error (non-critical):', purchaseError)
      }
      
      // Step 6: Send password reset email to customer
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        formData.customerEmail,
        { redirectTo: `${window.location.origin}/customer/dashboard` }
      )
      
      if (resetError) console.error('Error sending password reset:', resetError)
      
      // Success! Redirect to success page
      router.push(`/venue/events/created/${event.id}`)
      
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }
  
  const nextStep = () => {
    setStep(step + 1)
    window.scrollTo(0, 0)
  }
  
  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/venue/dashboard" className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl text-charcoal">Create New Event</h1>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`h-2 rounded-full transition ${step >= 1 ? 'bg-deep-green' : 'bg-sage-light'}`}></div>
              <p className={`text-sm mt-2 ${step >= 1 ? 'text-deep-green font-medium' : 'text-sage-dark'}`}>
                1. Event Details
              </p>
            </div>
            <div className="w-8"></div>
            <div className="flex-1">
              <div className={`h-2 rounded-full transition ${step >= 2 ? 'bg-deep-green' : 'bg-sage-light'}`}></div>
              <p className={`text-sm mt-2 ${step >= 2 ? 'text-deep-green font-medium' : 'text-sage-dark'}`}>
                2. Customer Info
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-light/50 border border-rose-light rounded-lg">
            <p className="text-sm text-rose-dark">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          
          {/* Step 1: Event Details */}
          {step === 1 && (
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
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                >
                  Next: Customer Info →
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Customer Info */}
          {step === 2 && (
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
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="customer@example.com"
                  />
                  <p className="text-xs text-sage-dark mt-1">
                    We'll send login details to this email
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
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
                >
                  {loading ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </div>
          )}
          
        </form>
      </div>
    </div>
  )
}
