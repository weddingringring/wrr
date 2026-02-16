'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Heart, Play, Pause, SkipBack, SkipForward, Clock,
  Download, Share2, Trash2, Undo2, Tag, MoreHorizontal, User,
  Check, X, Image as ImageIcon
} from 'lucide-react'

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

const AVAILABLE_TAGS = [
  'Family', 'Friends', 'Funny', 'Emotional', 'Heartfelt',
  'Speech', 'Kids', 'Musical', 'Surprise'
]

interface MessageCardStackProps {
  messages: Message[]
  onPlay: (messageId: string, recordingUrl: string) => void
  onToggleFavorite: (messageId: string, currentStatus: boolean) => void
  onSoftDelete: (messageId: string) => void
  onRestore: (messageId: string) => void
  onUpdateName: (messageId: string, name: string) => void
  onToggleTag: (messageId: string, tag: string) => void
  onDownload: (recordingUrl: string, name: string | null) => void
  onShare: (recordingUrl: string, name: string | null) => void
  onPhotoUpload: (messageId: string) => void
  currentlyPlaying: string | null
  playbackProgress: Record<string, number>
  filter: string
}

export default function MessageCardStack({
  messages,
  onPlay,
  onToggleFavorite,
  onSoftDelete,
  onRestore,
  onUpdateName,
  onToggleTag,
  onDownload,
  onShare,
  onPhotoUpload,
  currentlyPlaying,
  playbackProgress,
  filter,
}: MessageCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  // Clamp index
  const safeIndex = Math.min(currentIndex, Math.max(0, messages.length - 1))
  if (safeIndex !== currentIndex && messages.length > 0) {
    setCurrentIndex(safeIndex)
  }

  const getCardRotation = useCallback((index: number) => {
    const seed = index * 2654435761
    return ((seed % 700) - 350) / 100
  }, [])

  const getCardOffset = useCallback((index: number) => {
    const seed = index * 1597334677
    return {
      x: ((seed % 600) - 300) / 100,
      y: ((seed % 400) - 200) / 100,
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating || editingName || showMenu || showTags) return
    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setDragX(e.clientX - startPos.current.x)
    setDragY((e.clientY - startPos.current.y) * 0.3)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragX) > 100) {
      const direction = dragX > 0 ? 'right' : 'left'
      setExitDirection(direction)
      setIsAnimating(true)
      setTimeout(() => {
        setExitDirection(null)
        setDragX(0)
        setDragY(0)
        setIsAnimating(false)
        setShowMenu(false)
        setShowTags(false)
        setEditingName(false)
        if (direction === 'left') setCurrentIndex(i => Math.min(i + 1, messages.length - 1))
        else setCurrentIndex(i => Math.max(i - 1, 0))
      }, 350)
    } else {
      setDragX(0)
      setDragY(0)
    }
  }

  const goNext = () => {
    if (isAnimating || currentIndex >= messages.length - 1) return
    setExitDirection('left')
    setIsAnimating(true)
    setShowMenu(false)
    setShowTags(false)
    setEditingName(false)
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
    setShowMenu(false)
    setShowTags(false)
    setEditingName(false)
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
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (messages.length === 0) return null

  const msg = messages[safeIndex]
  if (!msg) return null

  const fav = msg.is_favorite || msg.is_favorited || false
  const duration = msg.duration_seconds || msg.duration || 0
  const progress = playbackProgress[msg.id] || 0
  const isPlaying = currentlyPlaying === msg.id

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Oooh+Baby&family=Caveat:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        .ivory-card {
          background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), inset 0 0 60px rgba(255,252,240,0.5);
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
        .card-pile {
          box-shadow: 0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04), 0 1px 0 rgba(200,185,155,0.15);
        }
        .card-name { font-family: 'Oooh Baby', cursive; color: #1a1a1a; }
        .card-detail { font-family: 'Caveat', cursive; color: #5a6b5e; }
        .card-counter { font-family: 'Caveat', cursive; }
        .card-play { transition: all 0.2s ease; }
        .card-play:hover { transform: scale(1.08); box-shadow: 0 4px 20px rgba(61,90,76,0.25); }
        .card-play:active { transform: scale(0.96); }
      `}</style>

      <div>
        {/* Card Stack */}
        <div className="relative flex items-center justify-center" style={{ minHeight: '380px', perspective: '1000px' }}>
          {/* Pile behind */}
          {[3, 2, 1].map(offset => {
            const idx = safeIndex + offset
            if (idx >= messages.length) return null
            const rot = getCardRotation(idx)
            const off = getCardOffset(idx)
            return (
              <div
                key={`pile-${offset}`}
                className="absolute ivory-card card-pile rounded-xl"
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  height: '360px',
                  transform: `rotate(${rot}deg) translate(${off.x}px, ${off.y + offset * 4}px) scale(${1 - offset * 0.02})`,
                  zIndex: 10 - offset,
                  opacity: 1 - offset * 0.15,
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )
          })}

          {/* Active card */}
          <div
            className="relative ivory-card rounded-xl select-none"
            style={{
              width: '100%',
              maxWidth: '420px',
              zIndex: 20,
              transform: exitDirection === 'left'
                ? 'translateX(-120%) rotate(-15deg)'
                : exitDirection === 'right'
                  ? 'translateX(120%) rotate(15deg)'
                  : `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragX * 0.05}deg)`,
              transition: isDragging ? 'none' : 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: exitDirection ? 0 : 1,
              touchAction: 'none',
              cursor: editingName || showMenu || showTags ? 'default' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="relative z-10 p-6">
              {/* Top row: favourite + menu */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(msg.id, fav) }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 transition"
                >
                  <Heart size={20} fill={fav ? '#C08585' : 'none'} stroke={fav ? '#C08585' : '#c4c4c4'} strokeWidth={1.5} />
                </button>

                {filter === 'trash' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestore(msg.id) }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    style={{ color: '#3D5A4C', background: 'rgba(61,90,76,0.08)' }}
                  >
                    <Undo2 size={14} />
                    Restore
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowTags(false) }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg hover:bg-black/5 transition"
                    >
                      <MoreHorizontal size={18} style={{ color: '#999' }} />
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                        <div
                          className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20"
                          style={{ border: '1px solid #e8ece9', minWidth: '160px' }}
                        >
                          <button
                            onClick={() => { onPhotoUpload(msg.id); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                            style={{ color: '#6E7D71' }}
                          >
                            <ImageIcon size={14} />
                            {msg.guest_photo_url ? 'Change photo' : 'Add photo'}
                          </button>
                          <button
                            onClick={() => { setShowTags(true); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                            style={{ color: '#6E7D71' }}
                          >
                            <Tag size={14} />
                            Edit tags
                          </button>
                          <button
                            onClick={() => { onShare(msg.recording_url, msg.caller_name); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                            style={{ color: '#6E7D71' }}
                          >
                            <Share2 size={14} />
                            Share
                          </button>
                          <div style={{ borderTop: '1px solid #e8ece9', margin: '4px 0' }}></div>
                          <button
                            onClick={() => { onSoftDelete(msg.id); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-rose-light/20 transition flex items-center gap-2"
                            style={{ color: '#C08585' }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Photo + Name + Date */}
              <div className="flex gap-5 mb-2">
                {msg.guest_photo_url && (
                  <div className="flex-shrink-0">
                    <div
                      className="rounded-lg overflow-hidden"
                      style={{
                        width: '80px', height: '80px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '2px solid rgba(255,252,240,0.8)',
                      }}
                    >
                      <img src={msg.guest_photo_url} alt={msg.caller_name || 'Guest'} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editNameValue.trim()) {
                            onUpdateName(msg.id, editNameValue.trim())
                            setEditingName(false)
                          }
                          if (e.key === 'Escape') setEditingName(false)
                        }}
                        className="text-2xl px-2 py-1 rounded border focus:outline-none focus:ring-2 w-full"
                        style={{ fontFamily: "'Oooh Baby', cursive", borderColor: '#e8ece9', color: '#1a1a1a' }}
                        autoFocus
                      />
                      <button
                        onClick={() => { if (editNameValue.trim()) { onUpdateName(msg.id, editNameValue.trim()); setEditingName(false) } }}
                        className="p-1 rounded hover:bg-sage-light/20"
                      >
                        <Check size={14} style={{ color: '#3D5A4C' }} />
                      </button>
                      <button onClick={() => setEditingName(false)} className="p-1 rounded hover:bg-sage-light/20">
                        <X size={14} style={{ color: '#999' }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (filter !== 'trash') {
                          setEditNameValue(msg.caller_name || '')
                          setEditingName(true)
                        }
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-left w-full"
                    >
                      <div className="card-name text-2xl sm:text-3xl leading-tight truncate">
                        {msg.caller_name || (
                          <span className="text-sage italic text-lg flex items-center gap-1" style={{ fontFamily: 'inherit' }}>
                            <User size={16} />
                            Tap to add name
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                  <div className="card-detail text-lg mt-0.5">
                    {formatDate(msg.recorded_at || msg.created_at)}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4" style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(180,165,135,0.4) 20%, rgba(180,165,135,0.4) 80%, transparent 100%)',
              }} />

              {/* Tags (inline edit or display) */}
              {showTags ? (
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(245,240,232,0.7)' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => onToggleTag(msg.id, tag)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                        style={{
                          background: (msg.tags || []).includes(tag) ? '#3D5A4C' : 'white',
                          color: (msg.tags || []).includes(tag) ? 'white' : '#6E7D71',
                          border: '1px solid',
                          borderColor: (msg.tags || []).includes(tag) ? '#3D5A4C' : '#e8ece9'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowTags(false)} className="mt-2 text-xs font-medium" style={{ color: '#3D5A4C' }}>
                    Done
                  </button>
                </div>
              ) : msg.tags && msg.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {msg.tags.map(tag => (
                    <span key={tag} className="card-detail text-sm px-3 py-0.5 rounded-full" style={{ background: 'rgba(61,90,76,0.06)', border: '1px solid rgba(61,90,76,0.1)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Duration */}
              <div className="flex items-center gap-1.5 card-detail text-lg mb-4">
                <Clock size={15} strokeWidth={1.5} style={{ color: '#8B9B8E' }} />
                {formatDuration(duration)}
              </div>

              {/* Notes */}
              {msg.notes && (
                <p className="card-detail text-base mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,240,232,0.5)' }}>
                  {msg.notes}
                </p>
              )}

              {/* Play + progress */}
              <div className="flex items-center gap-3">
                <button
                  className="card-play flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #3D5A4C 0%, #4a6d5b 100%)',
                    boxShadow: '0 2px 12px rgba(61,90,76,0.2)',
                  }}
                  onClick={(e) => { e.stopPropagation(); onPlay(msg.id, msg.recording_url) }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {isPlaying ? <Pause size={20} fill="white" stroke="white" /> : <Play size={20} fill="white" stroke="white" style={{ marginLeft: '2px' }} />}
                </button>
                <div className="flex-1">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(200,185,155,0.25)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isPlaying ? '#D4A5A5' : '#3D5A4C' }}></div>
                  </div>
                </div>
                <span className="text-xs font-mono" style={{ color: '#8B9B8E' }}>{formatDuration(duration)}</span>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center justify-end gap-1 mt-4 pt-3" style={{ borderTop: '1px solid rgba(200,185,155,0.2)' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(msg.recording_url, msg.caller_name) }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg hover:bg-black/5 transition"
                  title="Download"
                >
                  <Download size={16} style={{ color: '#999' }} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onShare(msg.recording_url, msg.caller_name) }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg hover:bg-black/5 transition"
                  title="Share"
                >
                  <Share2 size={16} style={{ color: '#999' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <button
            onClick={goPrev}
            disabled={currentIndex <= 0 || isAnimating}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: currentIndex <= 0 ? 'transparent' : 'rgba(61,90,76,0.08)',
              color: currentIndex <= 0 ? '#c4c4c4' : '#3D5A4C',
              opacity: currentIndex <= 0 ? 0.4 : 1,
            }}
          >
            <SkipBack size={20} />
          </button>

          <div className="flex items-center gap-1.5">
            {messages.map((_, i) => {
              const dist = Math.abs(i - safeIndex)
              if (dist > 3 && i !== 0 && i !== messages.length - 1) return null
              if (dist === 3 && i !== 0 && i !== messages.length - 1) {
                return <span key={i} className="text-xs" style={{ color: '#c4c4c4' }}>·</span>
              }
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    width: i === safeIndex ? '20px' : '6px',
                    height: '6px',
                    background: i === safeIndex ? '#3D5A4C' : 'rgba(61,90,76,0.2)',
                  }}
                  onClick={() => { if (!isAnimating) { setCurrentIndex(i); setShowMenu(false); setShowTags(false); setEditingName(false) } }}
                />
              )
            })}
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex >= messages.length - 1 || isAnimating}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: currentIndex >= messages.length - 1 ? 'transparent' : 'rgba(61,90,76,0.08)',
              color: currentIndex >= messages.length - 1 ? '#c4c4c4' : '#3D5A4C',
              opacity: currentIndex >= messages.length - 1 ? 0.4 : 1,
            }}
          >
            <SkipForward size={20} />
          </button>
        </div>

        <p className="text-center mt-2 text-xs" style={{ color: '#b0a898' }}>
          Swipe or use arrows to browse
        </p>
      </div>
    </>
  )
}
