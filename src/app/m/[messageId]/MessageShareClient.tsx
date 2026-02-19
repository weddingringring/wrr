'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Clock } from 'lucide-react'
import ParchmentCard from '@/components/ParchmentCard'

interface SharedMessage {
  id: string
  callerName: string | null
  duration: number
  audioUrl: string | null
  photoUrl: string | null
  recordedAt: string
}

interface EventInfo {
  partner1FirstName: string
  partner2FirstName: string
  eventType: string
  eventDate: string
}

interface VenueInfo {
  name: string
  logoUrl: string | null
  slug: string | null
}

export default function MessageShareClient({ params }: { params: { messageId: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<SharedMessage | null>(null)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [venue, setVenue] = useState<VenueInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        // Pass query params through from the URL
        const urlParams = new URLSearchParams(window.location.search)
        const e = urlParams.get('e')
        const s = urlParams.get('s')

        if (!e || !s) {
          setError('invalid')
          return
        }

        const res = await fetch(`/api/share/message/${params.messageId}?e=${e}&s=${s}`)

        if (!res.ok) {
          setError(res.status === 410 ? 'expired' : res.status === 403 ? 'invalid' : 'error')
          return
        }

        const data = await res.json()
        setMessage(data.message)
        setEvent(data.event)
        setVenue(data.venue || null)
      } catch {
        setError('error')
      } finally {
        setLoading(false)
      }
    }
    fetchMessage()

    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [params.messageId])

  const handlePlay = () => {
    if (!message?.audioUrl) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (progressInterval.current) clearInterval(progressInterval.current)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      if (progressInterval.current) clearInterval(progressInterval.current)
    }

    const audio = new Audio(message.audioUrl)
    audioRef.current = audio
    setIsPlaying(true)

    audio.play().catch(() => setIsPlaying(false))

    progressInterval.current = setInterval(() => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }, 100)

    audio.onended = () => {
      setIsPlaying(false)
      setProgress(0)
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const coupleNames = event
    ? (event.partner1FirstName && event.partner2FirstName
      ? `${event.partner1FirstName} & ${event.partner2FirstName}`
      : event.partner1FirstName || 'Wedding')
    : ''

  const eventLabel = (() => {
    if (!event) return 'celebration'
    const t = (event.eventType || '').toLowerCase()
    if (t.includes('wedding')) return 'wedding'
    if (t.includes('birthday')) return 'birthday'
    if (t.includes('anniversary')) return 'anniversary'
    if (t.includes('engagement')) return 'engagement'
    if (t.includes('party')) return 'party'
    return 'celebration'
  })()

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF' }}>
        <div style={{ width: '2rem', height: '2rem', border: '2px solid rgba(0,0,0,0.08)', borderTopColor: '#587e6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // --- Error states ---
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF', padding: '2rem' }}>
        <ParchmentCard maxWidth="400px" padding="2.5rem 2rem">
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', color: '#2c2418', textAlign: 'center', marginBottom: '0.75rem' }}>
            {error === 'expired' ? 'Link expired' : error === 'invalid' ? 'Invalid link' : 'Something went wrong'}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#8a7e6c', textAlign: 'center', lineHeight: 1.6 }}>
            {error === 'expired'
              ? 'This share link is no longer valid. Ask the person who shared it to send a new one.'
              : error === 'invalid'
              ? 'This link doesn\u2019t appear to be valid. Please check the link you were given.'
              : 'Please try again in a moment.'}
          </p>
        </ParchmentCard>
      </div>
    )
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Oooh+Baby&display=swap" rel="stylesheet" />
      <meta name="robots" content="noindex, nofollow, noarchive" />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .msg-photo-frame {
          background: white;
          padding: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.06);
          border-radius: 3px;
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#FFEFEF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem',
      }}>

        {/* Venue branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {venue?.logoUrl ? (
            <img
              src={venue.logoUrl}
              alt={venue.name || 'Venue'}
              style={{ maxWidth: '180px', maxHeight: '80px', objectFit: 'contain', margin: '0 auto', filter: 'grayscale(100%) opacity(0.7)' }}
            />
          ) : venue?.name ? (
            <p style={{
              fontSize: '0.65rem', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.15em',
              color: '#9a8e7a',
            }}>
              {venue.name}
            </p>
          ) : null}
        </div>

        {/* "A message from" + couple names */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 500,
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            color: '#a69d8e', marginBottom: '0.5rem',
          }}>
            A message from
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 500, color: '#2c2418',
            lineHeight: 1.3, margin: 0,
          }}>
            {coupleNames}&rsquo;s {eventLabel}
          </h1>
          {event?.eventDate && (
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '0.85rem', color: '#8a7e6c',
              marginTop: '0.4rem',
            }}>
              {new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Message card */}
        <ParchmentCard maxWidth="380px" padding="1.25rem">
          {/* Photo */}
          {message?.photoUrl ? (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="msg-photo-frame">
                <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                  <img src={message.photoUrl} alt={message.callerName || 'Guest'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="msg-photo-frame">
                <div style={{
                  aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play size={22} style={{ color: '#bbb', marginLeft: '3px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Caller name */}
          <p style={{
            fontFamily: "'Oooh Baby', cursive",
            fontSize: '1.4rem', color: '#1a1a1a',
            margin: '0 0 0.25rem 0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {message?.callerName || <span style={{ fontStyle: 'italic', color: '#bbb', fontSize: '1rem', fontFamily: 'inherit' }}>Unknown guest</span>}
          </p>

          {/* Date + duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#777' }}>
            {message?.recordedAt && (
              <span>{new Date(message.recordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            )}
            <span style={{ color: '#ccc' }}>&middot;</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} style={{ color: '#999' }} /> {formatDuration(message?.duration || 0)}
            </span>
          </div>

          {/* Audio player */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePlay}
              style={{
                flexShrink: 0, width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: message?.audioUrl ? 'pointer' : 'default',
                background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                opacity: message?.audioUrl ? 1 : 0.4,
              }}
            >
              {isPlaying
                ? <Pause size={16} fill="white" stroke="white" />
                : <Play size={16} fill="white" stroke="white" style={{ marginLeft: '2px' }} />
              }
            </button>

            <div style={{ flex: 1 }}>
              <div style={{
                height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', borderRadius: '2px',
                  background: isPlaying ? '#D4A5A5' : '#888',
                  transition: 'width 0.1s linear',
                }} />
              </div>
            </div>
          </div>
        </ParchmentCard>

        {/* View full album link */}
        {venue?.slug && (
          <a
            href={`/a/${venue.slug}`}
            style={{
              marginTop: '2rem',
              fontSize: '0.7rem', fontWeight: 500, color: '#a69d8e',
              textDecoration: 'none', letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
          >
            View full album &rarr;
          </a>
        )}

        {/* Footer branding */}
        <footer style={{ marginTop: venue?.slug ? '1.5rem' : '3rem', textAlign: 'center' }}>
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
