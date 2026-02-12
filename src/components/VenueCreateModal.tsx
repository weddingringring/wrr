'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface VenueCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function VenueCreateModal({ isOpen, onClose, onSuccess }: VenueCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    // Business info
    venueName: '',
    businessType: 'wedding_venue',
    
    // Owner account
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    countryCode: 'GB',
    
    // Optional
    website: '',
    instagram: '',
    
    // Subscription
    subscriptionType: 'rental',
    subscriptionStatus: 'active',
  })

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Call API route to create venue (uses Service Role Key on backend)
      const response = await fetch('/api/admin/create-venue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create venue')
      }

      // Success!
      setSuccess(true)
      
      // Send welcome email (optional)
      try {
        await fetch('/api/admin/send-venue-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.ownerEmail,
            venueName: formData.venueName,
            ownerName: `${formData.ownerFirstName} ${formData.ownerLastName}`,
            temporaryPassword: result.temporaryPassword
          })
        })
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't throw - venue was created successfully
      }
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        
        // Reset form
        setFormData({
          venueName: '',
          businessType: 'wedding_venue',
          ownerFirstName: '',
          ownerLastName: '',
          ownerEmail: '',
          ownerPhone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          county: '',
          postcode: '',
          countryCode: 'GB',
          website: '',
          instagram: '',
          subscriptionType: 'rental',
          subscriptionStatus: 'active',
        })
      }, 2000)
      
    } catch (err: any) {
      console.error('Create venue error:', err)
      setError(err.message || 'Failed to create venue')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
          }}>Create New Venue</h2>
          <p style={{ color: '#6a6a6a', fontSize: '0.95rem' }}>
            Add a new venue and create their owner account
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
              ✓ Venue created successfully! Closing...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
            {/* Business Information */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                Business Information
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venueName}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      placeholder="Thornbury Manor"
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
                      Venue Type *
                    </label>
                    <select
                      required
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
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
                      <option value="wedding_venue">Wedding Venue</option>
                      <option value="hotel">Hotel</option>
                      <option value="barn">Barn</option>
                      <option value="manor">Manor House</option>
                      <option value="garden">Garden Venue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                Owner Account
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ownerFirstName}
                      onChange={(e) => setFormData({ ...formData, ownerFirstName: e.target.value })}
                      placeholder="Jane"
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
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ownerLastName}
                      onChange={(e) => setFormData({ ...formData, ownerLastName: e.target.value })}
                      placeholder="Smith"
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="jane@venue.com"
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      placeholder="+44 20 1234 5678"
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
            </div>

            {/* Address */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                Address
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="123 Manor Road"
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
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="Optional"
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="London"
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
                      County
                    </label>
                    <input
                      type="text"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      placeholder="Greater London"
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
                      Postcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      placeholder="SW1A 1AA"
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
            </div>

            {/* Optional Info */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                Optional Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://venue.com"
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
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@venuename"
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

            {/* Subscription */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                Subscription
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Subscription Type *
                  </label>
                  <select
                    required
                    value={formData.subscriptionType}
                    onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
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
                    <option value="rental">Rental</option>
                    <option value="owned">Owned</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Status *
                  </label>
                  <select
                    required
                    value={formData.subscriptionStatus}
                    onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ 
              paddingTop: '1rem', 
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
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
                {loading ? 'Creating...' : 'Create Venue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
