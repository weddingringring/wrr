'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface VenueDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  venueId: string
}

interface Event {
  id: string
  partner_1_name: string
  partner_2_name: string | null
  event_date: string
  status: string
  twilio_phone_number: string | null
}

export default function VenueDetailsModal({ isOpen, onClose, venueId }: VenueDetailsModalProps) {
  const [venue, setVenue] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && venueId) {
      loadVenueDetails()
    }
  }, [isOpen, venueId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const loadVenueDetails = async () => {
    setLoading(true)
    try {
      // Load venue details
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single()

      if (venueError) throw venueError
      setVenue(venueData)

      // Load upcoming events (future events only)
      const today = new Date().toISOString().split('T')[0]
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, partner_1_name, partner_2_name, event_date, status, twilio_phone_number')
        .eq('venue_id', venueId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading venue details:', error)
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
        maxWidth: '900px',
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
          }}>
            {loading ? 'Loading...' : venue?.name}
          </h2>
          <p style={{ color: '#6a6a6a', fontSize: '0.95rem' }}>
            Venue Details & Upcoming Events
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

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6a6a6a' }}>
              Loading venue details...
            </div>
          ) : (
            <>
              {/* Venue Details */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                  Venue Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong style={{ color: '#374151' }}>Business Type:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.business_type?.replace('_', ' ') || '—'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Subscription:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.subscription_type} ({venue?.subscription_status})
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Primary Contact:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.primary_contact_name || '—'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Email:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.primary_contact_email || '—'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Phone:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.primary_contact_phone || '—'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Location:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.city}, {venue?.postcode}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Website:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.website ? (
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                          {venue.website}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Instagram:</strong>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
                      {venue?.instagram_handle || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>
                  Upcoming Events ({events.length})
                </h3>
                
                {events.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    color: '#6b7280'
                  }}>
                    No upcoming events scheduled
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                            Event
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                            Date
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                            Phone Number
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event) => (
                          <tr key={event.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a' }}>
                              {event.partner_1_name}
                              {event.partner_2_name && ` & ${event.partner_2_name}`}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                              {new Date(event.event_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                              {event.twilio_phone_number || 'Not assigned'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background: event.status === 'active' ? '#dcfce7' : '#e5e7eb',
                                color: event.status === 'active' ? '#166534' : '#374151'
                              }}>
                                {event.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: 600,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              background: 'white',
              color: '#6a6a6a',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
