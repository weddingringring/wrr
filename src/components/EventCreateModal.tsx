'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

interface EventCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  venueName?: string
}

const STEPS = [
  { key: 1, label: 'Event Details' },
  { key: 2, label: 'Customer Details' },
  { key: 3, label: 'Confirm' },
]

/* ─── Shared input style ─── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid #E8E6E2',
  borderRadius: '0.375rem',
  fontSize: '0.9375rem',
  color: '#111',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 500,
  fontSize: '0.8125rem',
  color: '#555',
  marginBottom: '0.375rem',
}

const requiredLabelStyle: React.CSSProperties = {
  ...labelStyle,
  fontWeight: 600,
  color: '#333',
}

const helperStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#999',
  marginTop: '0.25rem',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111',
  marginBottom: '0.75rem',
  letterSpacing: '-0.01em',
}

export default function EventCreateModal({ isOpen, onClose, onSuccess, venueName }: EventCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [step, setStep] = useState(1)

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

  // Close on ESC key (only if not loading)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [loading])

  const resetForm = () => {
    setFormData({
      eventType: 'wedding', eventTypeOther: '', eventDate: '', venueLocation: '',
      partner1FirstName: '', partner1LastName: '', partner2FirstName: '', partner2LastName: '',
      customerEmail: '', customerPhone: '', age: '', yearsTogether: '', companyName: '',
      expectedGuestCount: '', specialRequirements: '', notes: ''
    })
    setStep(1)
    setSuccess(false)
    setCreatedEventId(null)
    setError(null)
  }

  const handleClose = () => {
    if (success && onSuccess) onSuccess()
    resetForm()
    onClose()
  }

  /* ─── CRITICAL: Event is ONLY created here, on Step 3 submit ─── */
  const handleCreateEvent = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/venue/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create event')

      setCreatedEventId(result.eventId || null)
      setSuccess(true)
    } catch (err: any) {
      console.error('Create event error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isWedding = formData.eventType === 'wedding'
  const isAnniversary = formData.eventType === 'anniversary'
  const isBirthday = formData.eventType === 'birthday'
  const isCorporate = formData.eventType === 'corporate'

  const getEventDisplayName = () => {
    const p1 = `${formData.partner1FirstName} ${formData.partner1LastName}`.trim()
    const p2 = formData.partner2FirstName
      ? `${formData.partner2FirstName} ${formData.partner2LastName}`.trim()
      : null
    if (isWedding) return p2 ? `${p1} & ${p2}` : p1
    return p1
  }

  const formatDate = (d: string) => {
    if (!d) return '\u2014'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const getEventTypeLabel = () => {
    if (formData.eventType === 'other') return formData.eventTypeOther || 'Event'
    return formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) handleClose() }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', overflowY: 'auto'
      }}
    >
      <div style={{
        background: 'white', borderRadius: '0.75rem',
        maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', margin: '2rem 0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>

        {/* ─── SUCCESS STATE ─── */}
        {success ? (
          <div style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(61, 90, 76, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
            }}>
              <Check size={28} style={{ color: '#3D5A4C' }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.75rem',
              color: '#111', marginBottom: '0.5rem'
            }}>Event Created</h2>
            <p style={{ fontSize: '0.9375rem', color: '#666', lineHeight: 1.5, maxWidth: '360px', margin: '0 auto 2rem' }}>
              Login details have been emailed to the couple. They can access their dashboard straight away.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '0.375rem',
                  fontSize: '0.875rem', fontWeight: 500,
                  border: '1px solid #E8E6E2', background: 'white',
                  color: '#555', cursor: 'pointer'
                }}
              >Close</button>
            </div>
          </div>
        ) : (
          <>
            {/* ─── HEADER ─── */}
            <div style={{
              padding: '1.5rem 2rem 0', position: 'sticky', top: 0,
              background: 'white', zIndex: 10, borderRadius: '0.75rem 0.75rem 0 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
                  color: '#111', letterSpacing: '-0.02em'
                }}>Create New Event</h2>
                <button
                  onClick={handleClose}
                  style={{
                    width: '32px', height: '32px', border: 'none', background: 'none',
                    cursor: 'pointer', color: '#999', fontSize: '1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '0.25rem', flexShrink: 0
                  }}
                >×</button>
              </div>

              {/* ─── STEP PROGRESS ─── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0',
                paddingBottom: '1.25rem', borderBottom: '1px solid #E8E6E2'
              }}>
                {STEPS.map((s, i) => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {step > s.key ? (
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: '#3D5A4C', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Check size={11} style={{ color: 'white' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          border: step === s.key ? '2px solid #3D5A4C' : '1.5px solid #ccc',
                          background: step === s.key ? 'rgba(61,90,76,0.06)' : 'transparent',
                          flexShrink: 0
                        }} />
                      )}
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: step === s.key ? 600 : 400,
                        color: step === s.key ? '#111' : step > s.key ? '#3D5A4C' : '#aaa',
                        whiteSpace: 'nowrap'
                      }}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: '1px', margin: '0 0.75rem',
                        background: step > s.key ? '#3D5A4C' : '#E8E6E2'
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── FORM BODY ─── */}
            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              {error && (
                <div style={{
                  padding: '0.75rem 1rem', background: 'rgba(180,60,60,0.06)',
                  border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem',
                  color: '#a33', marginBottom: '1.25rem', fontSize: '0.8125rem'
                }}>{error}</div>
              )}

              {/* ═══ STEP 1: Event Details ═══ */}
              {step === 1 && (
                <div style={{ display: 'grid', gap: '0.875rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label style={requiredLabelStyle}>Event Type</label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="wedding">Wedding</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="birthday">Birthday</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={requiredLabelStyle}>Event Date</label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {formData.eventType === 'other' && (
                    <div>
                      <label style={requiredLabelStyle}>Specify Event Type</label>
                      <input
                        type="text"
                        value={formData.eventTypeOther}
                        onChange={(e) => setFormData({ ...formData, eventTypeOther: e.target.value })}
                        placeholder="e.g., Retirement Party"
                        style={inputStyle}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {venueName ? (
                    <div>
                      <label style={labelStyle}>Venue</label>
                      <div style={{
                        padding: '0.625rem 0.875rem', borderRadius: '0.375rem',
                        background: '#FAFAF9', border: '1px solid #E8E6E2',
                        fontSize: '0.9375rem', color: '#333'
                      }}>{venueName}</div>
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>Venue Location</label>
                      <input
                        type="text"
                        value={formData.venueLocation}
                        onChange={(e) => setFormData({ ...formData, venueLocation: e.target.value })}
                        placeholder="e.g., Grand Hall"
                        style={inputStyle}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Expected Guests</label>
                    <input
                      type="number"
                      value={formData.expectedGuestCount}
                      onChange={(e) => setFormData({ ...formData, expectedGuestCount: e.target.value })}
                      placeholder="e.g., 100"
                      style={inputStyle}
                      className="placeholder:text-gray-400"
                    />
                  </div>

                  {/* Event-specific fields */}
                  {isBirthday && (
                    <div>
                      <label style={labelStyle}>Age</label>
                      <input type="number" value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g., 30" style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                  )}
                  {isAnniversary && (
                    <div>
                      <label style={labelStyle}>Years Together</label>
                      <input type="number" value={formData.yearsTogether}
                        onChange={(e) => setFormData({ ...formData, yearsTogether: e.target.value })}
                        placeholder="e.g., 25" style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                  )}
                  {isCorporate && (
                    <div>
                      <label style={labelStyle}>Company Name</label>
                      <input type="text" value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g., Acme Corp" style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {/* ═══ STEP 2: Customer Details ═══ */}
              {step === 2 && (
                <div style={{ display: 'grid', gap: '0.875rem' }}>
                  <p style={sectionHeadingStyle}>
                    {isWedding || isAnniversary ? 'The Couple' : isCorporate ? 'Primary Contact' : 'Contact Details'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label style={requiredLabelStyle}>
                        {isWedding || isAnniversary ? 'Partner 1 First Name' : 'First Name'}
                      </label>
                      <input type="text" value={formData.partner1FirstName}
                        onChange={(e) => setFormData({ ...formData, partner1FirstName: e.target.value })}
                        style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label style={requiredLabelStyle}>
                        {isWedding || isAnniversary ? 'Partner 1 Last Name' : 'Last Name'}
                      </label>
                      <input type="text" value={formData.partner1LastName}
                        onChange={(e) => setFormData({ ...formData, partner1LastName: e.target.value })}
                        style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                  </div>

                  {(isWedding || isAnniversary) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                      <div>
                        <label style={labelStyle}>Partner 2 First Name</label>
                        <input type="text" value={formData.partner2FirstName}
                          onChange={(e) => setFormData({ ...formData, partner2FirstName: e.target.value })}
                          style={inputStyle} className="placeholder:text-gray-400" />
                      </div>
                      <div>
                        <label style={labelStyle}>Partner 2 Last Name</label>
                        <input type="text" value={formData.partner2LastName}
                          onChange={(e) => setFormData({ ...formData, partner2LastName: e.target.value })}
                          style={inputStyle} className="placeholder:text-gray-400" />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label style={requiredLabelStyle}>Email</label>
                      <input type="email" value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        style={inputStyle} className="placeholder:text-gray-400" />
                      <p style={helperStyle}>Login details will be sent here automatically.</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="text" value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="e.g., 07123 456789"
                        style={inputStyle} className="placeholder:text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: Review & Final Details ═══ */}
              {step === 3 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Summary Card */}
                  <div style={{
                    padding: '1rem 1.25rem', borderRadius: '0.5rem',
                    background: '#FAFAF9', border: '1px solid #E8E6E2'
                  }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      Event Summary
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Type</p>
                        <p style={{ fontSize: '0.875rem', color: '#111', fontWeight: 500 }}>{getEventTypeLabel()}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Date</p>
                        <p style={{ fontSize: '0.875rem', color: '#111', fontWeight: 500 }}>{formatDate(formData.eventDate)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>
                          {isWedding || isAnniversary ? 'Couple' : 'Contact'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#111', fontWeight: 500 }}>{getEventDisplayName()}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Venue</p>
                        <p style={{ fontSize: '0.875rem', color: '#111', fontWeight: 500 }}>{venueName || formData.venueLocation || '\u2014'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Event Notes <span style={{ fontWeight: 400, color: '#bbb' }}>(Optional)</span></label>
                    <textarea
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                      placeholder="Any details for your team — setup notes, timing, special arrangements…"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' as const }}
                      className="placeholder:text-gray-400"
                    />
                    <p style={helperStyle}>Internal notes for your team. Not visible to the couple.</p>
                  </div>
                </div>
              )}

              {/* ─── NAVIGATION BUTTONS ─── */}
              <div style={{
                paddingTop: '1.25rem', marginTop: '1.25rem',
                borderTop: '1px solid #E8E6E2',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                {/* Left: Back */}
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      disabled={loading}
                      style={{
                        padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                        fontSize: '0.8125rem', fontWeight: 500,
                        border: 'none', background: 'none',
                        color: '#888', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1
                      }}
                    >{'\u2190'} Back</button>
                  )}
                </div>

                {/* Right: Cancel + Primary CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                      fontSize: '0.8125rem', fontWeight: 500,
                      border: 'none', background: 'none',
                      color: '#999', cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >Cancel</button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      style={{
                        padding: '0.625rem 1.5rem', borderRadius: '0.375rem',
                        fontSize: '0.875rem', fontWeight: 600,
                        border: 'none', background: '#3D5A4C', color: 'white',
                        cursor: 'pointer', transition: 'background 0.15s'
                      }}
                    >Continue</button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      disabled={loading}
                      style={{
                        padding: '0.625rem 1.75rem', borderRadius: '0.375rem',
                        fontSize: '0.875rem', fontWeight: 600,
                        border: 'none', background: '#3D5A4C', color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1, transition: 'background 0.15s'
                      }}
                    >{loading ? 'Creating\u2026' : 'Create Event'}</button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
