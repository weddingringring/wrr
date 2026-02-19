'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Clock, Heart } from 'lucide-react'

interface GuestMessage {
  id: string
  callerName: string | null
  duration: number
  audioUrl: string | null
  photoUrl: string | null
  tags: string[] | null
  isFavorited: boolean
  recordedAt: string
}

interface AlbumEvent {
  eventType: string
  eventDate: string
  partner1FirstName: string
  partner2FirstName: string
  greetingUrl: string | null
  hasCustomGreeting: boolean
}

interface VenueInfo {
  name: string
  logoUrl: string | null
}

export default function GuestAlbumPage({ params }: { params: { code: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<AlbumEvent | null>(null)
  const [venue, setVenue] = useState<VenueInfo | null>(null)
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await fetch(`/api/share/${params.code}`)
        if (!res.ok) {
          setError(res.status === 404 ? 'album' : res.status === 410 ? 'expired' : 'error')
          return
        }
        const data = await res.json()
        setEvent(data.event)
        setVenue(data.venue || null)
        setMessages(data.messages || [])
      } catch {
        setError('error')
      } finally {
        setLoading(false)
      }
    }
    fetchAlbum()
  }, [params.code])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handlePlay = (messageId: string, audioUrl: string | null) => {
    if (!audioUrl) return

    // If same message, toggle
    if (currentlyPlaying === messageId && audioRef.current) {
      audioRef.current.pause()
      setCurrentlyPlaying(null)
      if (progressInterval.current) clearInterval(progressInterval.current)
      return
    }

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause()
      if (progressInterval.current) clearInterval(progressInterval.current)
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio
    setCurrentlyPlaying(messageId)

    audio.play().catch(() => setCurrentlyPlaying(null))

    progressInterval.current = setInterval(() => {
      if (audio.duration) {
        setPlaybackProgress(prev => ({
          ...prev,
          [messageId]: (audio.currentTime / audio.duration) * 100
        }))
      }
    }, 100)

    audio.onended = () => {
      setCurrentlyPlaying(null)
      setPlaybackProgress(prev => ({ ...prev, [messageId]: 0 }))
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF' }}>
        <div style={{ width: '2rem', height: '2rem', border: '2px solid rgba(0,0,0,0.08)', borderTopColor: '#587e6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // --- Error ---
  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFEFEF', padding: '2rem' }}>
        <div style={{
          maxWidth: '400px', width: '100%', textAlign: 'center',
          padding: '2.5rem 2rem',
          background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 40%, #F8F4E8 100%)',
          borderRadius: '1rem', boxShadow: '0 2px 8px rgba(120,100,70,0.06), 0 8px 32px rgba(120,100,70,0.08)',
          border: '1px solid rgba(180,165,140,0.15)',
        }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', color: '#2c2418', marginBottom: '0.75rem' }}>
            {error === 'album' ? 'Album not found' : error === 'expired' ? 'Access key expired' : 'Something went wrong'}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#8a7e6c', lineHeight: 1.6 }}>
            {error === 'album'
              ? 'This link may have expired or the key may have been changed.'
              : error === 'expired'
              ? 'This access key is no longer valid. Please ask the couple for a new one.'
              : 'Please try again in a moment.'}
          </p>
        </div>
      </div>
    )
  }

  // --- Album title ---
  const title = event.partner1FirstName && event.partner2FirstName
    ? `${event.partner1FirstName} & ${event.partner2FirstName}`
    : event.partner1FirstName || 'Wedding Guestbook'

  const subtitle = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Oooh+Baby&display=swap" rel="stylesheet" />
      <meta name="robots" content="noindex, nofollow, noarchive" />

      <div style={{ minHeight: '100vh', background: '#FFEFEF' }}>
        {/* Header area */}
        <header style={{ padding: '2rem 1.5rem 0', maxWidth: '960px', margin: '0 auto' }}>
          {/* Venue logo */}
          <div style={{ textAlign: 'center', paddingTop: '1rem', marginBottom: '0.75rem' }}>
            {venue?.logoUrl ? (
              <img
                src={venue.logoUrl}
                alt={venue.name || 'Venue'}
                style={{ maxWidth: '180px', maxHeight: '80px', objectFit: 'contain', margin: '0 auto', filter: 'grayscale(100%) opacity(0.7)' }}
              />
            ) : venue?.name ? (
              <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'rgba(0,0,0,0.25)' }}>
                {venue.name}
              </p>
            ) : null}
          </div>

          {/* Subtle sharing indicator */}
          <p style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#a69d8e', marginBottom: '1.5rem' }}>
            Viewing shared guestbook
          </p>

          {/* Partner names */}
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 500, color: '#2c2418', lineHeight: 1.2, marginBottom: '0.25rem' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '0.85rem', color: '#8a7e6c', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Message count */}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a69d8e', marginTop: '0.75rem', marginBottom: '0' }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''} from their special day
          </p>
        </header>

        {/* Messages grid */}
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#8a7e6c' }}>No messages have been shared yet.</p>
            </div>
          ) : (
            <>
              <style>{`
                .guest-tile {
                  background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
                  box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07);
                  position: relative;
                }
                .guest-tile::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  background-image:
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65 0.2' numOctaves='4' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E"),
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02 0.4' numOctaves='2' seed='8' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
                  opacity: 0.03;
                  mix-blend-mode: multiply;
                  pointer-events: none;
                }
                .guest-tile::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  border: 1px solid rgba(180, 165, 140, 0.25);
                  pointer-events: none;
                }
                .guest-photo-frame {
                  background: white;
                  padding: 5px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.06);
                  border-radius: 3px;
                }
                .guest-card-name { font-family: 'Oooh Baby', cursive; color: #1a1a1a; }
              `}</style>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {messages.map((msg, index) => {
                  const seed = index * 2654435761
                  const rotation = ((seed % 600) - 300) / 100
                  const isPlaying = currentlyPlaying === msg.id
                  const progress = playbackProgress[msg.id] || 0

                  return (
                    <div
                      key={msg.id}
                      className="guest-tile"
                      style={{
                        borderRadius: '0.75rem',
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${rotation}deg)`)}
                    >
                      <div style={{ position: 'relative', zIndex: 1, padding: '1rem' }}>
                        {/* Photo */}
                        {msg.photoUrl && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div className="guest-photo-frame">
                              <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                                <img src={msg.photoUrl} alt={msg.callerName || 'Guest'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No photo — subtle placeholder */}
                        {!msg.photoUrl && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div className="guest-photo-frame">
                              <div style={{
                                aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <div style={{
                                  width: '3rem', height: '3rem', borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.04)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Play size={18} style={{ color: '#bbb', marginLeft: '2px' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Name */}
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <p className="guest-card-name" style={{ fontSize: '1.35rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {msg.callerName || <span style={{ fontStyle: 'italic', color: '#bbb', fontSize: '1rem' }}>Unknown guest</span>}
                          </p>
                          {msg.isFavorited && (
                            <Heart size={14} fill="#D4A5A5" stroke="#D4A5A5" style={{ flexShrink: 0, marginTop: '0.35rem' }} />
                          )}
                        </div>

                        {/* Date + duration */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#777' }}>
                          <span>{new Date(msg.recordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          <span style={{ color: '#ccc' }}>&middot;</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} style={{ color: '#999' }} /> {formatDuration(msg.duration)}
                          </span>
                        </div>

                        {/* Play + progress */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button
                            onClick={() => handlePlay(msg.id, msg.audioUrl)}
                            style={{
                              flexShrink: 0, width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: msg.audioUrl ? 'pointer' : 'default',
                              background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              opacity: msg.audioUrl ? 1 : 0.4,
                            }}
                          >
                            {isPlaying
                              ? <Pause size={16} fill="white" stroke="white" />
                              : <Play size={16} fill="white" stroke="white" style={{ marginLeft: '2px' }} />
                            }
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(0,0,0,0.08)' }}>
                              <div style={{
                                height: '100%', borderRadius: '3px', transition: 'width 0.1s',
                                width: `${progress}%`,
                                background: isPlaying ? '#D4A5A5' : '#333',
                              }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#999' }}>
                            {formatDuration(msg.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{ padding: '2rem 1.5rem 3rem', textAlign: 'center' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 500,
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            color: 'rgba(0,0,0,0.18)',
            display: 'block', marginBottom: '0.5rem',
          }}>
            Powered by
          </span>
          <img
            src="/logo.svg"
            alt="WeddingRingRing"
            style={{ height: '1.5rem', opacity: 0.25 }}
          />
        </footer>
      </div>
    </>
  )
}
