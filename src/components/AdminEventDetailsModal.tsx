'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Eye, Edit3, Save, Phone, Mail, Calendar, MapPin, Users, MessageCircle, Clock, Check, Copy } from 'lucide-react'
import Link from 'next/link'

interface AdminEventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string | null
  userRole?: string
  onSuccess?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E8E6E2',
  borderRadius: '0.375rem', fontSize: '0.875rem', color: '#111', outline: 'none'
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.75rem', color: '#555',
  marginBottom: '0.25rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em'
}
const valueStyle: React.CSSProperties = { fontSize: '0.9375rem', color: '#111' }
const mutedStyle: React.CSSProperties = { fontSize: '0.8125rem', color: '#888' }

const countryFlag = (code?: string) =>
  code ? code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : ''

export default function AdminEventDetailsModal({ isOpen, onClose, eventId, userRole = 'admin', onSuccess }: AdminEventDetailsModalProps) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && eventId) {
      setEditing(false)
      setError('')
      loadEvent()
    }
  }, [isOpen, eventId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`*, venue:venues(id, name, city, country_code, primary_contact_email), messages:messages(count)`)
        .eq('id', eventId)
        .single()
      if (fetchError) throw fetchError
      const ev = { ...data, messages_count: data.messages?.[0]?.count || 0 }
      setEvent(ev)
      setEditData({
        partner_1_first_name: ev.partner_1_first_name || '',
        partner_1_last_name: ev.partner_1_last_name || '',
        partner_2_first_name: ev.partner_2_first_name || '',
        partner_2_last_name: ev.partner_2_last_name || '',
        customer_email: ev.customer_email || '',
        customer_phone: ev.customer_phone || '',
        event_date: ev.event_date || '',
        event_type: ev.event_type || 'wedding',
        expected_guest_count: ev.expected_guest_count || '',
        notes: ev.notes || '',
        special_requirements: ev.special_requirements || '',
        status: ev.status || 'active'
      })
    } catch (err: any) {
      console.error('Error loading event:', err)
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          partner_1_first_name: editData.partner_1_first_name,
          partner_1_last_name: editData.partner_1_last_name,
          partner_2_first_name: editData.partner_2_first_name || null,
          partner_2_last_name: editData.partner_2_last_name || null,
          customer_email: editData.customer_email,
          customer_phone: editData.customer_phone || null,
          event_date: editData.event_date,
          event_type: editData.event_type,
          expected_guest_count: editData.expected_guest_count ? parseInt(editData.expected_guest_count) : null,
          notes: editData.notes || null,
          special_requirements: editData.special_requirements || null,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
      if (updateError) throw updateError
      setEditing(false)
      await loadEvent()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const copyPhone = () => {
    if (event?.twilio_phone_number) {
      navigator.clipboard.writeText(event.twilio_phone_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen || !eventId) return null

  const getDisplayName = (e: any) => {
    const p1 = `${e.partner_1_first_name} ${e.partner_1_last_name}`.trim()
    const p2 = e.partner_2_first_name ? `${e.partner_2_first_name} ${e.partner_2_last_name}`.trim() : null
    if (e.event_type === 'wedding') return p2 ? `${p1} & ${p2}'s Wedding` : `${p1}'s Wedding`
    if (e.event_type === 'anniversary') return p2 ? `${p1} & ${p2}'s Anniversary` : `${p1}'s Anniversary`
    if (e.event_type === 'birthday') return e.age ? `${p1}'s ${e.age}th Birthday` : `${p1}'s Birthday`
    if (e.event_type === 'corporate') return e.company_name ? `${e.company_name} Event` : `${p1}'s Corporate Event`
    return `${p1}'s ${e.event_type}`
  }

  const daysUntil = event ? Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000) : 0
  const isPast = daysUntil < 0

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div style={{
        background: 'white', borderRadius: '0.75rem', maxWidth: '640px', width: '100%',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>

        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', border: '3px solid #E8E6E2', borderTopColor: '#3D5A4C', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#999', fontSize: '0.875rem' }}>Loading…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error && !event ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ color: '#a33', fontSize: '0.875rem' }}>{error}</p>
            <button onClick={onClose} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Close</button>
          </div>
        ) : event && (
          <>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #E8E6E2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#111', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                    {getDisplayName(event)}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#888' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: '-1px' }} />
                    {new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Status + venue row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', padding: '2px 10px', borderRadius: '999px',
                  fontSize: '0.6875rem', fontWeight: 500,
                  background: event.status === 'active' ? 'rgba(61,90,76,0.08)' : event.status === 'completed' ? 'rgba(140,160,140,0.1)' : 'rgba(200,100,100,0.08)',
                  color: event.status === 'active' ? '#3D5A4C' : event.status === 'completed' ? '#7a8a7a' : '#b05050',
                }}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                <span style={{ fontSize: '0.75rem', color: '#bbb' }}>•</span>
                <span style={{ fontSize: '0.8125rem', color: '#666' }}>
                  {countryFlag(event.venue?.country_code)} {event.venue?.name}
                  {event.venue?.city && <span style={{ color: '#bbb' }}> — {event.venue.city}</span>}
                </span>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

              {error && (
                <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem', color: '#a33', marginBottom: '1rem', fontSize: '0.8125rem' }}>{error}</div>
              )}

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    {isPast ? 'Days Ago' : 'Days Until'}
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: isPast ? '#888' : '#3D5A4C' }}>{Math.abs(daysUntil)}</p>
                </div>
                <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Messages</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: event.messages_count > 0 ? '#111' : '#ccc' }}>{event.messages_count}</p>
                </div>
                <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Guests</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: event.expected_guest_count ? '#111' : '#ccc' }}>{event.expected_guest_count || '—'}</p>
                </div>
              </div>

              {/* Phone number */}
              <div style={{ background: event.twilio_phone_number ? 'rgba(61,90,76,0.04)' : '#FAFAF9', border: `1px solid ${event.twilio_phone_number ? 'rgba(61,90,76,0.15)' : '#E8E6E2'}`, borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    <Phone size={10} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: '-1px' }} />
                    Event Phone Number
                  </p>
                  <p style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 600, color: event.twilio_phone_number ? '#3D5A4C' : '#ccc' }}>
                    {event.twilio_phone_number || 'Not yet assigned'}
                  </p>
                </div>
                {event.twilio_phone_number && (
                  <button onClick={copyPhone} style={{ background: 'none', border: '1px solid #E8E6E2', borderRadius: '0.25rem', cursor: 'pointer', padding: '0.375rem', color: copied ? '#3D5A4C' : '#bbb' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {editing ? (
                /* ─── EDIT MODE ─── */
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Partner 1 First Name</label>
                      <input value={editData.partner_1_first_name} onChange={e => setEditData({ ...editData, partner_1_first_name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Partner 1 Last Name</label>
                      <input value={editData.partner_1_last_name} onChange={e => setEditData({ ...editData, partner_1_last_name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Partner 2 First Name</label>
                      <input value={editData.partner_2_first_name} onChange={e => setEditData({ ...editData, partner_2_first_name: e.target.value })} style={inputStyle} placeholder="Optional" />
                    </div>
                    <div>
                      <label style={labelStyle}>Partner 2 Last Name</label>
                      <input value={editData.partner_2_last_name} onChange={e => setEditData({ ...editData, partner_2_last_name: e.target.value })} style={inputStyle} placeholder="Optional" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input value={editData.customer_email} onChange={e => setEditData({ ...editData, customer_email: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input value={editData.customer_phone} onChange={e => setEditData({ ...editData, customer_phone: e.target.value })} style={inputStyle} placeholder="Optional" />
                    </div>
                    <div>
                      <label style={labelStyle}>Event Date</label>
                      <input type="date" value={editData.event_date} onChange={e => setEditData({ ...editData, event_date: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Event Type</label>
                      <select value={editData.event_type} onChange={e => setEditData({ ...editData, event_type: e.target.value })} style={inputStyle}>
                        <option value="wedding">Wedding</option>
                        <option value="birthday">Birthday</option>
                        <option value="christening">Christening</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="corporate">Corporate</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Expected Guests</label>
                      <input type="number" value={editData.expected_guest_count} onChange={e => setEditData({ ...editData, expected_guest_count: e.target.value })} style={inputStyle} placeholder="Optional" />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} style={inputStyle}>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} style={{ ...inputStyle, minHeight: '4rem', resize: 'vertical' as const }} placeholder="Internal notes…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Special Requirements</label>
                    <textarea value={editData.special_requirements} onChange={e => setEditData({ ...editData, special_requirements: e.target.value })} style={{ ...inputStyle, minHeight: '3rem', resize: 'vertical' as const }} placeholder="Optional" />
                  </div>
                </div>
              ) : (
                /* ─── VIEW MODE ─── */
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* Contact info */}
                  <div>
                    <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Contact Information</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Primary Contact</p>
                        <p style={valueStyle}>{event.partner_1_first_name} {event.partner_1_last_name}</p>
                      </div>
                      {event.partner_2_first_name && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Partner 2</p>
                          <p style={valueStyle}>{event.partner_2_first_name} {event.partner_2_last_name}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Email</p>
                        <a href={`mailto:${event.customer_email}`} style={{ ...valueStyle, color: '#3D5A4C', textDecoration: 'none' }}>{event.customer_email}</a>
                      </div>
                      {event.customer_phone && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Phone</p>
                          <p style={valueStyle}>{event.customer_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event details */}
                  <div>
                    <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Event Details</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Type</p>
                        <p style={valueStyle}>{event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}</p>
                      </div>
                      {event.expected_guest_count && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Expected Guests</p>
                          <p style={valueStyle}>{event.expected_guest_count}</p>
                        </div>
                      )}
                      {event.age && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Age</p>
                          <p style={valueStyle}>{event.age}</p>
                        </div>
                      )}
                      {event.years_together && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Years Together</p>
                          <p style={valueStyle}>{event.years_together}</p>
                        </div>
                      )}
                      {event.company_name && (
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Company</p>
                          <p style={valueStyle}>{event.company_name}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.125rem' }}>Greeting</p>
                        <p style={valueStyle}>{event.greeting_audio_url ? '✓ Uploaded' : '⏳ Pending'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(event.notes || event.special_requirements) && (
                    <div>
                      <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Notes</p>
                      {event.notes && (
                        <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: event.special_requirements ? '0.5rem' : 0 }}>
                          <p style={{ fontSize: '0.8125rem', color: '#444', whiteSpace: 'pre-wrap' as const }}>{event.notes}</p>
                        </div>
                      )}
                      {event.special_requirements && (
                        <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.375rem', padding: '0.75rem' }}>
                          <p style={{ fontSize: '0.6875rem', color: '#999', marginBottom: '0.25rem' }}>Special Requirements</p>
                          <p style={{ fontSize: '0.8125rem', color: '#444', whiteSpace: 'pre-wrap' as const }}>{event.special_requirements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{ borderTop: '1px solid #E8E6E2', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '0.6875rem', color: '#bbb' }}>
                        Created {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {event.twilio_number_purchased_at && (
                        <p style={{ fontSize: '0.6875rem', color: '#bbb' }}>
                          Number purchased {new Date(event.twilio_number_purchased_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <p style={{ fontSize: '0.6875rem', color: '#bbb' }}>
                        ID: {event.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 2rem', borderTop: '1px solid #E8E6E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {userRole === 'developer' && event.customer_user_id && (
                  <Link
                    href={`/customer/dashboard?viewAs=${event.customer_user_id}`}
                    onClick={onClose}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#888', textDecoration: 'none', padding: '0.5rem 0.75rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem' }}
                  >
                    <Eye size={13} /> View as Customer
                  </Link>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {editing ? (
                  <>
                    <button onClick={() => { setEditing(false); setError('') }} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: '#888' }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', background: '#3D5A4C', color: 'white', cursor: saving ? 'wait' : 'pointer', fontSize: '0.8125rem', fontWeight: 600, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.8125rem', color: '#555', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Edit3 size={13} /> Edit
                    </button>
                    <button onClick={onClose} style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', background: '#3D5A4C', color: 'white', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
