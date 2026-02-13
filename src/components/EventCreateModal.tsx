'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface EventCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EventCreateModal({ isOpen, onClose, onSuccess }: EventCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Call API route to create event (uses Service Role Key on backend)
      const response = await fetch('/api/venue/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event')
      }

      // Success!
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        
        // Reset form
        setFormData({
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
        setStep(1)
        setSuccess(false)
      }, 2000)
      
    } catch (err: any) {
      console.error('Create event error:', err)
      setError(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isWedding = formData.eventType === 'wedding'
  const isAnniversary = formData.eventType === 'anniversary'
  const isBirthday = formData.eventType === 'birthday'
  const isCorporate = formData.eventType === 'corporate'

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        margin: '2rem 0'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            marginBottom: '0.5rem',
            color: '#1a1a1a'
          }}>Create New Event</h2>
          <p style={{ color: '#6a6a6a', fontSize: '0.95rem' }}>
            Step {step} of 3
          </p>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              width: '44px',
              height: '44px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#6a6a6a',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '1rem',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '0.375rem',
              color: '#721c24',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '0.375rem',
              color: '#155724',
              textAlign: 'center',
              marginBottom: '1.5rem',
              fontWeight: 500
            }}>
              ✓ Event created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
            {/* Step 1: Event Details */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                  Event Details
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Event Type *
                    </label>
                    <select
                      required
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                        background: 'white'
                      }}
                    >
                      <option value="wedding">Wedding</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="birthday">Birthday</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {formData.eventType === 'other' && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Specify Event Type *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.eventTypeOther}
                        onChange={(e) => setFormData({ ...formData, eventTypeOther: e.target.value })}
                        placeholder="e.g., Retirement Party"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Venue Location
                    </label>
                    <input
                      type="text"
                      value={formData.venueLocation}
                      onChange={(e) => setFormData({ ...formData, venueLocation: e.target.value })}
                      placeholder="e.g., Grand Hall"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                      }}
                      className="placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Expected Guest Count
                    </label>
                    <input
                      type="number"
                      value={formData.expectedGuestCount}
                      onChange={(e) => setFormData({ ...formData, expectedGuestCount: e.target.value })}
                      placeholder="e.g., 100"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                      }}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Customer Information */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                  Customer Information
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        {isWedding || isAnniversary ? 'Partner 1 First Name' : isCorporate ? 'Contact First Name' : 'First Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.partner1FirstName}
                        onChange={(e) => setFormData({ ...formData, partner1FirstName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        {isWedding || isAnniversary ? 'Partner 1 Last Name' : isCorporate ? 'Contact Last Name' : 'Last Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.partner1LastName}
                        onChange={(e) => setFormData({ ...formData, partner1LastName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {(isWedding || isAnniversary) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                          Partner 2 First Name
                        </label>
                        <input
                          type="text"
                          value={formData.partner2FirstName}
                          onChange={(e) => setFormData({ ...formData, partner2FirstName: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            color: '#000',
                          }}
                          className="placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                          Partner 2 Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.partner2LastName}
                          onChange={(e) => setFormData({ ...formData, partner2LastName: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            color: '#000',
                          }}
                          className="placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Phone
                      </label>
                      <input
                        type="text"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="e.g., 07123 456789"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Event-specific fields */}
                  {isBirthday && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g., 30"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {isAnniversary && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Years Together
                      </label>
                      <input
                        type="number"
                        value={formData.yearsTogether}
                        onChange={(e) => setFormData({ ...formData, yearsTogether: e.target.value })}
                        placeholder="e.g., 25"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {isCorporate && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g., Acme Corp"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          color: '#000',
                        }}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                  Additional Details
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Special Requirements
                    </label>
                    <textarea
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                      placeholder="e.g., Wheelchair access, dietary requirements"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                        resize: 'vertical'
                      }}
                      className="placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Internal Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes for your reference"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#000',
                        resize: 'vertical'
                      }}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ 
              paddingTop: '1rem', 
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'space-between'
            }}>
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      background: 'white',
                      color: '#6a6a6a',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    background: 'white',
                    color: '#6a6a6a',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    style={{
                      padding: '0.75rem 2rem',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: 'none',
                      background: '#1a1a1a',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.75rem 2rem',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: 'none',
                      background: '#1a1a1a',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
