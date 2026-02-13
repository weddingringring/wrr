'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface VenueEditModalProps {
  isOpen: boolean
  onClose: () => void
  venueId: string
  onSuccess?: () => void
}

export default function VenueEditModal({ isOpen, onClose, venueId, onSuccess }: VenueEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    venueName: '',
    businessType: 'wedding_venue',
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

  // Load venue data when modal opens
  useEffect(() => {
    if (isOpen && venueId) {
      loadVenueData()
    }
  }, [isOpen, venueId])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const loadVenueData = async () => {
    setLoadingData(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single()

      if (fetchError) throw fetchError

      // Populate form with existing data
      setFormData({
        venueName: data.name || '',
        businessType: data.business_type || 'wedding_venue',
        addressLine1: data.address_line_1 || '',
        addressLine2: data.address_line_2 || '',
        city: data.city || '',
        county: data.county || '',
        postcode: data.postcode || '',
        countryCode: data.country === 'UK' ? 'GB' : 'Other',
        website: data.website || '',
        instagram: data.instagram_handle || '',
        subscriptionType: data.subscription_type || 'rental',
        subscriptionStatus: data.subscription_status || 'active',
      })

      // Set logo preview if exists
      if (data.logo_url) {
        setLogoPreview(data.logo_url)
      }
    } catch (err: any) {
      console.error('Error loading venue:', err)
      setError('Failed to load venue data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Prepare logo as base64 if new file selected
      let logoBase64 = null
      if (logoFile) {
        const reader = new FileReader()
        logoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(logoFile)
        })
      }

      // Call API route to update venue
      const response = await fetch('/api/admin/update-venue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          venueId,
          ...formData,
          logo: logoBase64,
          logoFileName: logoFile?.name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update venue')
      }

      // Success!
      setSuccess(true)
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
      }, 1500)
      
    } catch (err: any) {
      console.error('Update venue error:', err)
      setError(err.message || 'Failed to update venue')
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
          }}>Edit Venue</h2>
          <p style={{ color: '#6a6a6a', fontSize: '0.95rem' }}>
            Update venue information
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
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6a6a6a' }}>
              Loading venue data...
            </div>
          ) : (
            <>
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
                  ✓ Venue updated successfully! Closing...
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

                    {/* Logo Upload */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Venue Logo
                      </label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {logoPreview && (
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '0.5rem', 
                            overflow: 'hidden',
                            border: '2px solid rgba(0, 0, 0, 0.08)'
                          }}>
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              color: '#000',
                              background: 'white'
                            }}
                          />
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                            PNG, JPG or SVG (max 2MB)
                          </p>
                        </div>
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
                    <input
                      type="text"
                      required
                      placeholder="Address Line 1"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
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

                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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

                      <input
                        type="text"
                        placeholder="County"
                        value={formData.county}
                        onChange={(e) => setFormData({ ...formData, county: e.target.value })}
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

                      <input
                        type="text"
                        required
                        placeholder="Postcode"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
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

                {/* Optional Info */}
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                    Optional Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <input
                      type="url"
                      placeholder="Website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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

                    <input
                      type="text"
                      placeholder="Instagram Handle"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
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

                {/* Subscription */}
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                    Subscription
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                        Type
                      </label>
                      <select
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
                        Status
                      </label>
                      <select
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

                {/* Submit Buttons */}
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
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
