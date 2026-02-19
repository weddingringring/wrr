'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle, Trash2, ShieldOff } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'event' | 'venue'
  targetId: string | null
  targetName: string
}

export default function DeleteConfirmModal({ isOpen, onClose, onSuccess, type, targetId, targetName }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [info, setInfo] = useState<{ events: number; messages: number; hasPhone: boolean } | null>(null)

  useEffect(() => {
    if (isOpen && targetId) {
      setConfirmText('')
      setError('')
      setResult(null)
      loadImpactInfo()
    }
  }, [isOpen, targetId])

  const loadImpactInfo = async () => {
    setLoadingInfo(true)
    try {
      if (type === 'event') {
        const { count: messageCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', targetId!)
        const { data: event } = await supabase
          .from('events')
          .select('twilio_phone_number')
          .eq('id', targetId!)
          .single()
        setInfo({ events: 1, messages: messageCount || 0, hasPhone: !!event?.twilio_phone_number })
      } else {
        // Venue — count events and messages
        const { data: events } = await supabase
          .from('events')
          .select('id, twilio_phone_number')
          .eq('venue_id', targetId!)
        const eventIds = (events || []).map(e => e.id)
        let totalMessages = 0
        if (eventIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('event_id', eventIds)
          totalMessages = count || 0
        }
        setInfo({
          events: events?.length || 0,
          messages: totalMessages,
          hasPhone: (events || []).some(e => e.twilio_phone_number)
        })
      }
    } catch (err) {
      console.error('Error loading impact info:', err)
    } finally {
      setLoadingInfo(false)
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'Delete') return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const endpoint = type === 'event' ? '/api/admin/delete-event' : '/api/admin/delete-venue'
      const bodyKey = type === 'event' ? 'eventId' : 'venueId'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ [bodyKey]: targetId, confirmationText: 'Delete' })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Delete failed')
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (type !== 'venue') return
    setLoading(true)
    setError('')
    try {
      const { error: updateErr } = await supabase
        .from('venues')
        .update({ is_active: false })
        .eq('id', targetId!)
      if (updateErr) throw updateErr
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !targetId) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div style={{ background: 'white', borderRadius: '0.75rem', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

        {result ? (
          /* ─── Success ─── */
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '3rem', height: '3rem', background: 'rgba(61,90,76,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={20} style={{ color: '#3D5A4C' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#111', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Permanently Deleted</p>
            <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '0.875rem', textAlign: 'left', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#555', lineHeight: 1.6 }}>
                {result.eventsDeleted !== undefined && <>Events deleted: <strong>{result.eventsDeleted}</strong><br /></>}
                Messages deleted: <strong>{result.messagesDeleted}</strong><br />
                Twilio numbers released: <strong>{type === 'event' ? (result.twilioReleased ? 1 : 0) : result.twilioReleased}</strong><br />
                Customer accounts deleted: <strong>{type === 'event' ? (result.customerDeleted ? 1 : 0) : result.customersDeleted}</strong>
                {result.venueOwnerDeleted && <><br />Venue owner account deleted: <strong>Yes</strong></>}
              </p>
            </div>
            <button onClick={onSuccess} style={{ padding: '0.625rem 2rem', border: 'none', borderRadius: '0.375rem', background: '#3D5A4C', color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #E8E6E2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(180,60,60,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={18} style={{ color: '#a33' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111' }}>
                    Permanently Delete {type === 'event' ? 'Event' : 'Venue'}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#888' }}>{targetName}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem 2rem' }}>
              {/* Warning */}
              <div style={{ background: 'rgba(180,60,60,0.04)', border: '1px solid rgba(180,60,60,0.12)', borderRadius: '0.5rem', padding: '0.875rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.8125rem', color: '#a33', fontWeight: 600, marginBottom: '0.375rem' }}>⚠ This action cannot be undone</p>
                <p style={{ fontSize: '0.8125rem', color: '#666', lineHeight: 1.5 }}>
                  This is intended for deleting fake test data in development. Consider deactivating instead for real data.
                </p>
              </div>

              {/* Impact summary */}
              {loadingInfo ? (
                <p style={{ fontSize: '0.8125rem', color: '#999', textAlign: 'center', padding: '1rem 0' }}>Loading impact…</p>
              ) : info && (
                <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '0.875rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' as any, letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 500 }}>What will be deleted:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                    {type === 'venue' && (
                      <p style={{ fontSize: '0.8125rem', color: '#555' }}>Events: <strong style={{ color: '#111' }}>{info.events}</strong></p>
                    )}
                    <p style={{ fontSize: '0.8125rem', color: '#555' }}>Messages: <strong style={{ color: info.messages > 0 ? '#a33' : '#111' }}>{info.messages}</strong></p>
                    <p style={{ fontSize: '0.8125rem', color: '#555' }}>Twilio number: <strong style={{ color: '#111' }}>{info.hasPhone ? 'Yes (will release)' : 'None'}</strong></p>
                    <p style={{ fontSize: '0.8125rem', color: '#555' }}>Customer account: <strong style={{ color: '#111' }}>Yes</strong></p>
                    {type === 'venue' && (
                      <p style={{ fontSize: '0.8125rem', color: '#555' }}>Venue owner account: <strong style={{ color: '#111' }}>Yes</strong></p>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#555', marginBottom: '0.375rem' }}>
                  Type <strong>Delete</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Delete"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>

              {error && (
                <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem', color: '#a33', marginBottom: '1rem', fontSize: '0.8125rem' }}>{error}</div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {type === 'venue' && (
                  <button
                    onClick={handleDeactivate}
                    disabled={loading}
                    style={{ flex: 1, padding: '0.625rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                  >
                    <ShieldOff size={14} /> Deactivate Instead
                  </button>
                )}
                <button onClick={onClose} disabled={loading}
                  style={{ flex: 1, padding: '0.625rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.8125rem', color: '#888' }}>
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'Delete' || loading}
                  style={{
                    flex: 1, padding: '0.625rem', border: 'none', borderRadius: '0.375rem',
                    background: confirmText === 'Delete' ? '#a33' : '#ddd',
                    color: 'white', cursor: confirmText === 'Delete' && !loading ? 'pointer' : 'not-allowed',
                    fontSize: '0.8125rem', fontWeight: 600, opacity: loading ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                  }}
                >
                  <Trash2 size={14} /> {loading ? 'Deleting…' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
