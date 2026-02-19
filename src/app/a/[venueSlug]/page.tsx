'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ParchmentCard from '@/components/ParchmentCard'

interface VenueInfo {
  id: string
  name: string
  logoUrl: string | null
  slug: string
  event: {
    partner1FirstName: string | null
    partner2FirstName: string | null
    eventType: string | null
  } | null
}

interface ValidatedEvent {
  code: string
  partner1FirstName: string | null
  partner2FirstName: string | null
  eventType: string | null
}

export default function VenueAccessPage({ params }: { params: { venueSlug: string } }) {
  const router = useRouter()
  const [venue, setVenue] = useState<VenueInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [key, setKey] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [helpExpanded, setHelpExpanded] = useState(false)
  const [success, setSuccess] = useState<ValidatedEvent | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await fetch(`/api/venue/by-slug/${params.venueSlug}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setVenue(data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchVenue()
  }, [params.venueSlug])

  // Auto-format: uppercase + space after 4 chars
  const handleKeyInput = (value: string) => {
    const stripped = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
    const formatted = stripped.length > 4
      ? `${stripped.slice(0, 4)} ${stripped.slice(4)}`
      : stripped
    setKey(formatted)
    setError(null)
  }

  const handleSubmit = async () => {
    const code = key.replace(/\s/g, '')
    if (code.length !== 8) {
      setError("Please enter the full 8-character key.")
      return
    }

    setValidating(true)
    setError(null)

    try {
      const res = await fetch('/api/share/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (data.valid) {
        // Show personalised welcome, then redirect
        setSuccess({
          code: data.code,
          partner1FirstName: data.partner1FirstName,
          partner2FirstName: data.partner2FirstName,
          eventType: data.eventType,
        })
        setTimeout(() => {
          router.push(`/guest/${data.code}`)
        }, 2200)
      } else if (res.status === 410) {
        setError("This access key has expired. Please ask the couple for a new one.")
      } else {
        setError("That key doesn\u2019t look quite right \u2014 please check and try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setValidating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  // Build personalised headline from names + event type
  const buildHeadline = (p1: string | null, p2: string | null, evType: string | null) => {
    const names = [p1, p2].filter(Boolean).join(' & ') || null

    const eventLabel = (() => {
      const t = (evType || '').toLowerCase()
      if (t.includes('wedding')) return 'wedding'
      if (t.includes('birthday')) return 'birthday'
      if (t.includes('anniversary')) return 'anniversary'
      if (t.includes('engagement')) return 'engagement'
      if (t.includes('corporate') || t.includes('work')) return 'event'
      if (t.includes('party')) return 'party'
      return 'celebration'
    })()

    if (names) {
      return `${names} have invited you to listen to their ${eventLabel} audio guestbook`
    }
    return `You\u2019re invited to listen to this ${eventLabel} audio guestbook`
  }

  // Initial headline from venue event data (personalised if sharing is active)
  const initialHeadline = venue?.event
    ? buildHeadline(venue.event.partner1FirstName, venue.event.partner2FirstName, venue.event.eventType)
    : 'You\u2019re invited to listen to an audio guestbook'

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF' }}>
        <div style={{ width: '2rem', height: '2rem', border: '2px solid rgba(0,0,0,0.08)', borderTopColor: '#587e6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // --- Not found ---
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF', padding: '2rem' }}>
        <ParchmentCard maxWidth="400px" padding="2.5rem 2rem">
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', color: '#2c2418', textAlign: 'center', marginBottom: '0.75rem' }}>
            Page not found
          </p>
          <p style={{ fontSize: '0.8rem', color: '#8a7e6c', textAlign: 'center', lineHeight: 1.6 }}>
            We couldn&rsquo;t find a venue at this address. Please check the link you were given.
          </p>
        </ParchmentCard>
      </div>
    )
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .welcome-fade-in { animation: fadeInUp 0.6s ease forwards; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#FFEFEF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem',
      }}>

        {/* Venue branding */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          {venue?.logoUrl ? (
            <img
              src={venue.logoUrl}
              alt={venue.name || 'Venue'}
              style={{ maxWidth: '220px', maxHeight: '100px', objectFit: 'contain', margin: '0 auto', filter: 'grayscale(100%) opacity(0.85)' }}
            />
          ) : venue?.name ? (
            <p style={{
              fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.15em',
              color: '#9a8e7a',
            }}>
              {venue.name}
            </p>
          ) : null}
        </div>

        {/* Main access card */}
        <ParchmentCard maxWidth="440px" padding="2.75rem 2.25rem">
          {success ? (
            /* ── Success: personalised welcome ── */
            <div className="welcome-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.3rem', fontWeight: 500, color: '#2c2418',
                lineHeight: 1.45, marginBottom: '1.25rem',
              }}>
                {buildHeadline(success.partner1FirstName, success.partner2FirstName, success.eventType)}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(0,0,0,0.08)', borderTopColor: '#587e6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', color: '#8a7e6c' }}>Opening guestbook&hellip;</span>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : (
            /* ── Key entry form ── */
            <>
              {/* Headline */}
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.35rem', fontWeight: 500, color: '#2c2418',
                textAlign: 'center', lineHeight: 1.4, marginBottom: '0.75rem',
              }}>
                {initialHeadline}
              </h1>

              {/* Subtext */}
              <p style={{
                fontSize: '0.8rem', color: '#8a7e6c', textAlign: 'center',
                lineHeight: 1.6, marginBottom: '2rem',
              }}>
                Enter the private access key they have shared with you.
              </p>

              {/* Key input */}
              <input
                ref={inputRef}
                type="text"
                value={key}
                onChange={(e) => handleKeyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="XXXX XXXX"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.9rem 1rem',
                  background: '#F0ECE4',
                  border: error ? '1px solid rgba(180,120,100,0.35)' : '1px solid rgba(180,165,140,0.15)',
                  borderRadius: '0.5rem',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '1.25rem', fontWeight: 700,
                  letterSpacing: '0.2em', textAlign: 'center',
                  color: '#2c2418',
                  outline: 'none',
                  textTransform: 'uppercase' as const,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(180,165,140,0.35)' }}
                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(180,165,140,0.15)' }}
              />

              {/* Error */}
              {error && (
                <p style={{ fontSize: '0.75rem', color: '#a07060', textAlign: 'center', marginTop: '0.6rem', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={validating || key.replace(/\s/g, '').length < 8}
                style={{
                  width: '100%', marginTop: '1.25rem',
                  padding: '0.7rem 1rem', borderRadius: '0.5rem',
                  background: '#587e6a', color: '#f5f2ec', border: 'none',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.01em',
                  cursor: validating ? 'wait' : key.replace(/\s/g, '').length < 8 ? 'default' : 'pointer',
                  opacity: validating || key.replace(/\s/g, '').length < 8 ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {validating ? 'Checking\u2026' : 'View guestbook'}
              </button>

              {/* Help link */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button
                  onClick={() => setHelpExpanded(!helpExpanded)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: '0.7rem', color: '#a69d8e', fontWeight: 500,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                >
                  What is a private key?
                </button>
                {helpExpanded && (
                  <p style={{
                    fontSize: '0.7rem', color: '#8a7e6c', lineHeight: 1.6,
                    marginTop: '0.5rem', textAlign: 'center',
                  }}>
                    A private key allows invited guests to view selected messages from the special day.
                  </p>
                )}
              </div>
            </>
          )}
        </ParchmentCard>

        {/* Footer branding */}
        <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 500,
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            color: 'rgba(0,0,0,0.2)',
            display: 'block', marginBottom: '0.5rem',
          }}>
            Powered by
          </span>
          <img
            src="/logo.png"
            alt="WeddingRingRing"
            style={{ height: '2rem', opacity: 0.35 }}
          />
        </footer>
      </div>
    </>
  )
}
