'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Heart, Play, Pause, SkipBack, SkipForward, Phone, Clock } from 'lucide-react'

interface Message {
  id: string
  caller_number: string
  recording_url: string
  duration_seconds: number
  duration: number
  created_at: string
  recorded_at: string
  is_favorite: boolean
  is_favorited: boolean
  caller_name: string | null
  notes: string | null
  tags: string[] | null
  guest_photo_url: string | null
  is_deleted: boolean
}

interface MessageCardStackProps {
  messages: Message[]
  onPlay: (messageId: string, recordingUrl: string) => void
  currentlyPlaying: string | null
}

export default function MessageCardStack({ messages, onPlay, currentlyPlaying }: MessageCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Filter out deleted messages
  const activeMessages = messages.filter(m => !m.is_deleted)

  // Seeded random for consistent card rotations
  const getCardRotation = useCallback((index: number) => {
    const seed = index * 2654435761
    return ((seed % 700) - 350) / 100 // -3.5 to 3.5 degrees
  }, [])

  const getCardOffset = useCallback((index: number) => {
    const seed = index * 1597334677
    return {
      x: ((seed % 600) - 300) / 100,  // -3 to 3px
      y: ((seed % 400) - 200) / 100,  // -2 to 2px
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating) return
    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - startPos.current.x
    const dy = (e.clientY - startPos.current.y) * 0.3
    setDragX(dx)
    setDragY(dy)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 100
    if (Math.abs(dragX) > threshold) {
      // Fling card away
      const direction = dragX > 0 ? 'right' : 'left'
      setExitDirection(direction)
      setIsAnimating(true)

      setTimeout(() => {
        setExitDirection(null)
        setDragX(0)
        setDragY(0)
        setIsAnimating(false)
        if (direction === 'left') {
          setCurrentIndex(i => Math.min(i + 1, activeMessages.length - 1))
        } else {
          setCurrentIndex(i => Math.max(i - 1, 0))
        }
      }, 350)
    } else {
      // Snap back
      setDragX(0)
      setDragY(0)
    }
  }

  const goNext = () => {
    if (isAnimating || currentIndex >= activeMessages.length - 1) return
    setExitDirection('left')
    setIsAnimating(true)
    setTimeout(() => {
      setExitDirection(null)
      setDragX(0)
      setDragY(0)
      setIsAnimating(false)
      setCurrentIndex(i => i + 1)
    }, 350)
  }

  const goPrev = () => {
    if (isAnimating || currentIndex <= 0) return
    setExitDirection('right')
    setIsAnimating(true)
    setTimeout(() => {
      setExitDirection(null)
      setDragX(0)
      setDragY(0)
      setIsAnimating(false)
      setCurrentIndex(i => i - 1)
    }, 350)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (activeMessages.length === 0) return null

  // Show up to 4 cards in the stack
  const visibleCards = activeMessages.slice(
    Math.max(0, currentIndex - 1),
    currentIndex + 4
  )

  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Ohhh+Baby&family=Caveat:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes cardEntrance {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .card-stack-container {
          animation: cardEntrance 0.6s ease-out;
        }
        .ivory-card {
          background: linear-gradient(
            145deg,
            #FFFEF7 0%,
            #FBF8F0 25%,
            #F8F4E8 50%,
            #FBF7ED 75%,
            #FFFDF5 100%
          );
          box-shadow:
            0 1px 2px rgba(0,0,0,0.04),
            0 4px 8px rgba(0,0,0,0.04),
            0 8px 24px rgba(0,0,0,0.06),
            inset 0 0 60px rgba(255,252,240,0.5);
        }
        .ivory-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.025;
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        .ivory-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(200, 185, 155, 0.3);
          pointer-events: none;
        }
        .card-shadow-pile {
          box-shadow:
            0 2px 4px rgba(0,0,0,0.02),
            0 4px 12px rgba(0,0,0,0.04),
            0 1px 0 rgba(200,185,155,0.15);
        }
        .name-handwritten {
          font-family: 'Ohhh Baby', cursive;
          color: #1a1a1a;
        }
        .detail-handwritten {
          font-family: 'Caveat', cursive;
          color: #5a6b5e;
        }
        .play-ring {
          transition: all 0.2s ease;
        }
        .play-ring:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 20px rgba(61,90,76,0.25);
        }
        .play-ring:active {
          transform: scale(0.96);
        }
        .card-counter {
          font-family: 'Caveat', cursive;
        }
      `}</style>

      <div className="card-stack-container rounded-2xl p-6 sm:p-8" style={{
        background: 'linear-gradient(180deg, #F2DEDE 0%, #EACECE 100%)',
        border: '1px solid rgba(200, 165, 165, 0.35)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl" style={{ color: '#3D5A4C' }}>Messages</h2>
            <p className="text-sm" style={{ color: '#8B9B8E' }}>{activeMessages.length} voice message{activeMessages.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="card-counter text-lg" style={{ color: '#8B9B8E' }}>
            {currentIndex + 1} / {activeMessages.length}
          </div>
        </div>

        {/* Card Stack Area */}
        <div className="relative flex items-center justify-center" style={{ minHeight: '340px', perspective: '1000px' }}>

          {/* Background pile cards (behind current) */}
          {[3, 2, 1].map(offset => {
            const idx = currentIndex + offset
            if (idx >= activeMessages.length) return null
            const rot = getCardRotation(idx)
            const off = getCardOffset(idx)
            const scale = 1 - offset * 0.02
            const yShift = offset * 4

            return (
              <div
                key={`pile-${offset}`}
                className="absolute ivory-card card-shadow-pile rounded-xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  height: '280px',
                  transform: `rotate(${rot}deg) translate(${off.x}px, ${off.y + yShift}px) scale(${scale})`,
                  zIndex: 10 - offset,
                  opacity: 1 - offset * 0.15,
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )
          })}

          {/* Active (top) card */}
          {activeMessages[currentIndex] && (
            <div
              ref={cardRef}
              className="relative ivory-card rounded-xl cursor-grab active:cursor-grabbing select-none"
              style={{
                width: '100%',
                maxWidth: '380px',
                minHeight: '280px',
                zIndex: 20,
                transform: exitDirection === 'left'
                  ? `translateX(-120%) rotate(-15deg)`
                  : exitDirection === 'right'
                    ? `translateX(120%) rotate(15deg)`
                    : `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragX * 0.05}deg)`,
                transition: isDragging ? 'none' : 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: exitDirection ? 0 : 1,
                touchAction: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="relative z-10 p-7 flex flex-col h-full" style={{ minHeight: '280px' }}>
                {/* Favorite indicator */}
                {(activeMessages[currentIndex].is_favorite || activeMessages[currentIndex].is_favorited) && (
                  <div className="absolute top-4 right-5">
                    <Heart size={18} fill="#C08585" stroke="#C08585" />
                  </div>
                )}

                <div className="flex gap-5">
                  {/* Photo */}
                  {activeMessages[currentIndex].guest_photo_url && (
                    <div className="flex-shrink-0">
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{
                          width: '80px',
                          height: '80px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '2px solid rgba(255,252,240,0.8)',
                        }}
                      >
                        <img
                          src={activeMessages[currentIndex].guest_photo_url}
                          alt={activeMessages[currentIndex].caller_name || 'Guest'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="name-handwritten text-2xl sm:text-3xl mb-1 leading-tight pr-8">
                      {activeMessages[currentIndex].caller_name || 'Unknown guest'}
                    </div>

                    {/* Date */}
                    <div className="detail-handwritten text-lg mb-2">
                      {formatDate(activeMessages[currentIndex].recorded_at || activeMessages[currentIndex].created_at)}
                    </div>
                  </div>
                </div>

                {/* Decorative line */}
                <div className="mt-5 mb-6" style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(180,165,135,0.4) 20%, rgba(180,165,135,0.4) 80%, transparent 100%)',
                }} />

                {/* Duration & Phone */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 detail-handwritten text-lg">
                    <Clock size={15} strokeWidth={1.5} style={{ color: '#8B9B8E' }} />
                    {formatDuration(activeMessages[currentIndex].duration_seconds || activeMessages[currentIndex].duration || 0)}
                  </div>
                  <div className="flex items-center gap-1.5 detail-handwritten text-lg">
                    <Phone size={15} strokeWidth={1.5} style={{ color: '#8B9B8E' }} />
                    {activeMessages[currentIndex].caller_number || 'Unknown'}
                  </div>
                </div>

                {/* Tags */}
                {activeMessages[currentIndex].tags && activeMessages[currentIndex].tags!.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {activeMessages[currentIndex].tags!.map(tag => (
                      <span
                        key={tag}
                        className="detail-handwritten text-base px-3 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(61,90,76,0.08)',
                          color: '#3D5A4C',
                          border: '1px solid rgba(61,90,76,0.12)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Play button */}
                <div className="flex items-center justify-center">
                  <button
                    className="play-ring flex items-center justify-center rounded-full"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #3D5A4C 0%, #4a6d5b 100%)',
                      boxShadow: '0 2px 12px rgba(61,90,76,0.2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlay(activeMessages[currentIndex].id, activeMessages[currentIndex].recording_url)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {currentlyPlaying === activeMessages[currentIndex].id ? (
                      <Pause size={22} fill="white" stroke="white" />
                    ) : (
                      <Play size={22} fill="white" stroke="white" style={{ marginLeft: '2px' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0 || isAnimating}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: currentIndex === 0 ? 'transparent' : 'rgba(61,90,76,0.08)',
              color: currentIndex === 0 ? '#c4c4c4' : '#3D5A4C',
              opacity: currentIndex === 0 ? 0.4 : 1,
            }}
          >
            <SkipBack size={20} />
          </button>

          {/* Dot indicators (show max 7) */}
          <div className="flex items-center gap-1.5">
            {activeMessages.map((_, i) => {
              // Only show dots near current
              const dist = Math.abs(i - currentIndex)
              if (dist > 3 && i !== 0 && i !== activeMessages.length - 1) return null
              if (dist === 3 && i !== 0 && i !== activeMessages.length - 1) {
                return <span key={i} className="text-xs" style={{ color: '#c4c4c4' }}>·</span>
              }

              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIndex ? '20px' : '6px',
                    height: '6px',
                    background: i === currentIndex
                      ? '#3D5A4C'
                      : 'rgba(61,90,76,0.2)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (!isAnimating) setCurrentIndex(i)
                  }}
                />
              )
            })}
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex >= activeMessages.length - 1 || isAnimating}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: currentIndex >= activeMessages.length - 1 ? 'transparent' : 'rgba(61,90,76,0.08)',
              color: currentIndex >= activeMessages.length - 1 ? '#c4c4c4' : '#3D5A4C',
              opacity: currentIndex >= activeMessages.length - 1 ? 0.4 : 1,
            }}
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Swipe hint */}
        <p className="text-center mt-3 text-xs" style={{ color: '#b0a898' }}>
          Swipe or use arrows to browse
        </p>
      </div>
    </>
  )
}
