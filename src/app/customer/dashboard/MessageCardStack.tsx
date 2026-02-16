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
  photoSignedUrls: Record<string, string>
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
  photoSignedUrls,
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
  const [skipTransition, setSkipTransition] = useState(false)
  const [enterFrom, setEnterFrom] = useState<'left' | 'right' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })

  const safeIndex = Math.min(currentIndex, Math.max(0, messages.length - 1))
  if (safeIndex !== currentIndex && messages.length > 0) {
    setCurrentIndex(safeIndex)
  }

  const getCardRotation = useCallback((index: number) => {
    const seed = index * 2654435761
    return ((seed % 1000) - 500) / 100
  }, [])

  const getCardOffset = useCallback((index: number) => {
    const seed = index * 1597334677
    const seed2 = index * 2246822519
    return {
      x: ((seed % 1200) - 600) / 100,
      y: ((seed2 % 800) - 400) / 100,
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
      const goingForward = direction === 'left'
      setExitDirection(direction)
      setIsAnimating(true)
      setTimeout(() => {
        setExitDirection(null)
        setDragX(0)
        setDragY(0)
        setShowMenu(false)
        setShowTags(false)
        setEditingName(false)
        if (goingForward) {
          // Going forward: next card is already underneath, appear instantly
          setSkipTransition(true)
          setCurrentIndex(i => Math.min(i + 1, messages.length - 1))
          setIsAnimating(false)
          requestAnimationFrame(() => { requestAnimationFrame(() => setSkipTransition(false)) })
        } else {
          // Going backward: previous card flies in from the left
          setSkipTransition(true)
          setEnterFrom('left')
          setCurrentIndex(i => Math.max(i - 1, 0))
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setSkipTransition(false)
              setEnterFrom(null)
              setIsAnimating(false)
            })
          })
        }
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
      setSkipTransition(true)
      setCurrentIndex(i => i + 1)
      setIsAnimating(false)
      requestAnimationFrame(() => { requestAnimationFrame(() => setSkipTransition(false)) })
    }, 350)
  }

  const goPrev = () => {
    if (isAnimating || currentIndex <= 0) return
    setIsAnimating(true)
    setShowMenu(false)
    setShowTags(false)
    setEditingName(false)
    // Card flies in from the left onto the deck
    setSkipTransition(true)
    setEnterFrom('left')
    setCurrentIndex(i => i - 1)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSkipTransition(false)
        setEnterFrom(null)
        setTimeout(() => setIsAnimating(false), 350)
      })
    })
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

  const getPhotoUrl = (m: Message): string | null => {
    if (!m.guest_photo_url) return null
    if (m.guest_photo_url.startsWith('http')) return m.guest_photo_url
    return photoSignedUrls[m.id] || null
  }

  // Static card content for pile cards (no interactivity)
  const renderStaticContent = (m: Message) => {
    const photo = getPhotoUrl(m)
    const dur = m.duration_seconds || m.duration || 0
    const f = m.is_favorite || m.is_favorited || false
    return (
      <div className="relative z-10 p-5">
        <div className="mb-4">
          {photo ? (
            <div className="photo-frame">
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                <img src={photo} alt={m.caller_name || 'Guest'} className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="photo-frame">
              <div className="flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <ImageIcon size={22} style={{ color: '#999' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: '#999' }}>Tap to add photo</span>
              </div>
            </div>
          )}
        </div>
        <div className="card-name text-2xl sm:text-3xl leading-tight truncate mb-1">
          {m.caller_name || <span className="italic text-lg" style={{ fontFamily: 'inherit', color: '#aaa' }}>Unknown guest</span>}
        </div>
        <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#777' }}>
          <span>{formatDate(m.recorded_at || m.created_at)}</span>
          <span style={{ color: '#ccc' }}>&middot;</span>
          <span className="flex items-center gap-1">
            <Clock size={13} strokeWidth={1.5} style={{ color: '#999' }} />
            {formatDuration(dur)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)' }}>
            <Play size={20} fill="white" stroke="white" style={{ marginLeft: '2px' }} />
          </div>
          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}></div>
          </div>
          <span className="text-xs font-mono" style={{ color: '#999' }}>{formatDuration(dur)}</span>
        </div>
        <div className="my-3" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent 100%)' }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-1"><Heart size={18} fill={f ? '#C08585' : 'none'} stroke={f ? '#C08585' : '#bbb'} strokeWidth={1.5} /></div>
            <div className="p-1"><Tag size={15} style={{ color: '#999' }} /></div>
            {m.tags && m.tags.length > 0 && (
              <div className="flex items-center gap-1 overflow-hidden">
                {m.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.05)', color: '#666', border: '1px solid rgba(0,0,0,0.08)' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="p-2"><Download size={16} style={{ color: '#999' }} /></div>
            <div className="p-2"><Share2 size={16} style={{ color: '#999' }} /></div>
          </div>
        </div>
      </div>
    )
  }

  if (messages.length === 0) return null

  const msg = messages[safeIndex]
  if (!msg) return null

  const fav = msg.is_favorite || msg.is_favorited || false
  const duration = msg.duration_seconds || msg.duration || 0
  const progress = playbackProgress[msg.id] || 0
  const isPlaying = currentlyPlaying === msg.id
  const photoUrl = getPhotoUrl(msg)

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Oooh+Baby&display=swap" rel="stylesheet" />

      <style>{`
        .parchment-card {
          background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07), inset 0 0 60px rgba(255,252,240,0.5);
          position: relative;
        }
        .parchment-card::before {
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
        .parchment-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(180, 165, 140, 0.25);
          pointer-events: none;
        }
        .card-name { font-family: 'Oooh Baby', cursive; color: #1a1a1a; }
        .photo-frame {
          background: white;
          padding: 6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1), 0 4px 14px rgba(0,0,0,0.07);
          border-radius: 3px;
        }
        .card-play { transition: all 0.2s ease; }
        .card-play:hover { transform: scale(1.08); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .card-play:active { transform: scale(0.96); }
      `}</style>

      <div style={{ overflowX: 'hidden', padding: '12px 0 0' }}>
        <div className="relative flex items-center justify-center" style={{ minHeight: '500px', perspective: '1000px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            {/* Pile cards with content - 2 cards on each side pre-rendered */}
            {[2, 1, -1, -2].map(offset => {
              const idx = safeIndex + offset
              if (idx < 0 || idx >= messages.length) return null
              const pileMsg = messages[idx]
              if (!pileMsg) return null
              const rot = getCardRotation(idx)
              const off = getCardOffset(idx)
              return (
                <div
                  key={`pile-${pileMsg.id}`}
                  className="parchment-card rounded-xl"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    transform: `rotate(${rot}deg) translate(${off.x}px, ${off.y}px)`,
                    zIndex: 10 - Math.abs(offset),
                    opacity: 1 - Math.abs(offset) * 0.05,
                  }}
                >
                  {renderStaticContent(pileMsg)}
                </div>
              )
            })}

            {/* Active card */}
            <div
              className="parchment-card rounded-xl select-none"
              style={{
                position: 'relative',
                width: '100%',
                zIndex: 20,
                transform: exitDirection === 'left'
                  ? 'translateX(-120%) rotate(-15deg)'
                  : exitDirection === 'right'
                    ? 'translateX(120%) rotate(15deg)'
                    : enterFrom === 'left'
                      ? 'translateX(-120%) rotate(-12deg)'
                      : enterFrom === 'right'
                        ? 'translateX(120%) rotate(12deg)'
                        : `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragX * 0.05 + getCardRotation(safeIndex)}deg)`,
                transition: (isDragging || skipTransition) ? 'none' : 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: 1,
                touchAction: 'none',
                cursor: editingName || showMenu || showTags ? 'default' : 'grab',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
            <div className="relative z-10 p-5">
              {/* Photo area */}
              <div className="mb-4">
                {photoUrl ? (
                  <div className="photo-frame">
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                      <img src={photoUrl} alt={msg.caller_name || 'Guest'} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (filter !== 'trash') onPhotoUpload(msg.id) }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full transition-colors"
                  >
                    <div className="photo-frame">
                      <div className="flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <ImageIcon size={22} style={{ color: '#999' }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: '#999' }}>Tap to add photo</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Name + menu */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editNameValue.trim()) { onUpdateName(msg.id, editNameValue.trim()); setEditingName(false) }
                          if (e.key === 'Escape') setEditingName(false)
                        }}
                        className="text-2xl px-2 py-1 rounded border focus:outline-none focus:ring-2 w-full"
                        style={{ fontFamily: "'Oooh Baby', cursive", borderColor: '#ddd', color: '#1a1a1a' }}
                        autoFocus
                      />
                      <button onClick={() => { if (editNameValue.trim()) { onUpdateName(msg.id, editNameValue.trim()); setEditingName(false) } }} className="p-1 rounded hover:bg-black/5">
                        <Check size={14} style={{ color: '#333' }} />
                      </button>
                      <button onClick={() => setEditingName(false)} className="p-1 rounded hover:bg-black/5">
                        <X size={14} style={{ color: '#999' }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (filter !== 'trash') { setEditNameValue(msg.caller_name || ''); setEditingName(true) } }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-left w-full"
                    >
                      <div className="card-name text-2xl sm:text-3xl leading-tight truncate">
                        {msg.caller_name || (
                          <span className="italic text-lg flex items-center gap-1" style={{ fontFamily: 'inherit', color: '#aaa' }}>
                            <User size={16} /> Tap to add name
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </div>

                {filter === 'trash' ? (
                  <button onClick={(e) => { e.stopPropagation(); onRestore(msg.id) }} onPointerDown={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition flex-shrink-0" style={{ color: '#333', background: 'rgba(0,0,0,0.06)' }}>
                    <Undo2 size={14} /> Restore
                  </button>
                ) : (
                  <div className="relative flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowTags(false) }} onPointerDown={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-black/5 transition">
                      <MoreHorizontal size={18} style={{ color: '#999' }} />
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20" style={{ border: '1px solid #e0e0e0', minWidth: '160px' }}>
                          <button onClick={() => { onPhotoUpload(msg.id); setShowMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2" style={{ color: '#555' }}>
                            <ImageIcon size={14} /> {msg.guest_photo_url ? 'Change photo' : 'Add photo'}
                          </button>
                          <button onClick={() => { onShare(msg.recording_url, msg.caller_name); setShowMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2" style={{ color: '#555' }}>
                            <Share2 size={14} /> Share
                          </button>
                          <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                          <button onClick={() => { onSoftDelete(msg.id); setShowMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition flex items-center gap-2" style={{ color: '#C08585' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Date + duration */}
              <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#777' }}>
                <span>{formatDate(msg.recorded_at || msg.created_at)}</span>
                <span style={{ color: '#ccc' }}>&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} strokeWidth={1.5} style={{ color: '#999' }} />
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Notes */}
              {msg.notes && (
                <p className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', color: '#666' }}>{msg.notes}</p>
              )}

              {/* Play + progress */}
              <div className="flex items-center gap-3">
                <button
                  className="card-play flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
                  onClick={(e) => { e.stopPropagation(); onPlay(msg.id, msg.recording_url) }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {isPlaying ? <Pause size={20} fill="white" stroke="white" /> : <Play size={20} fill="white" stroke="white" style={{ marginLeft: '2px' }} />}
                </button>
                <div className="flex-1">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isPlaying ? '#D4A5A5' : '#333' }}></div>
                  </div>
                </div>
                <span className="text-xs font-mono" style={{ color: '#999' }}>{formatDuration(duration)}</span>
              </div>

              {/* Divider */}
              <div className="my-3" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent 100%)' }} />

              {/* Bottom bar */}
              <div className="flex items-center justify-between">
                {filter === 'trash' ? (
                  <button onClick={(e) => { e.stopPropagation(); onRestore(msg.id) }} onPointerDown={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs font-medium transition" style={{ color: '#333' }}>
                    <Undo2 size={14} /> Restore
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(msg.id, fav) }} onPointerDown={(e) => e.stopPropagation()} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition">
                        <Heart size={18} fill={fav ? '#C08585' : 'none'} stroke={fav ? '#C08585' : '#bbb'} strokeWidth={1.5} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); setShowMenu(false) }} onPointerDown={(e) => e.stopPropagation()} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition" title="Edit tags">
                        <Tag size={15} style={{ color: '#999' }} />
                      </button>
                      {msg.tags && msg.tags.length > 0 && !showTags && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          {msg.tags.map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: 'rgba(0,0,0,0.05)', color: '#666', border: '1px solid rgba(0,0,0,0.08)' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); onDownload(msg.recording_url, msg.caller_name) }} onPointerDown={(e) => e.stopPropagation()} className="p-2 rounded-lg hover:bg-black/5 transition" title="Download">
                        <Download size={16} style={{ color: '#999' }} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onShare(msg.recording_url, msg.caller_name) }} onPointerDown={(e) => e.stopPropagation()} className="p-2 rounded-lg hover:bg-black/5 transition" title="Share">
                        <Share2 size={16} style={{ color: '#999' }} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Tag editor */}
              {showTags && (
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map(tag => (
                      <button key={tag} onClick={() => onToggleTag(msg.id, tag)} className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                        style={{ background: (msg.tags || []).includes(tag) ? '#333' : 'white', color: (msg.tags || []).includes(tag) ? 'white' : '#666', border: '1px solid', borderColor: (msg.tags || []).includes(tag) ? '#333' : '#ddd' }}
                      >{tag}</button>
                    ))}
                  </div>
                  <button onClick={() => setShowTags(false)} className="mt-2 text-xs font-medium" style={{ color: '#333' }}>Done</button>
                </div>
              )}
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
            style={{ background: currentIndex <= 0 ? 'transparent' : 'rgba(0,0,0,0.06)', color: currentIndex <= 0 ? '#ccc' : '#333', opacity: currentIndex <= 0 ? 0.4 : 1 }}
          >
            <SkipBack size={20} />
          </button>

          <div className="flex items-center gap-1.5">
            {messages.map((_, i) => {
              const dist = Math.abs(i - safeIndex)
              if (dist > 3 && i !== 0 && i !== messages.length - 1) return null
              if (dist === 3 && i !== 0 && i !== messages.length - 1) {
                return <span key={i} className="text-xs" style={{ color: '#ccc' }}>·</span>
              }
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300 cursor-pointer"
                  style={{ width: i === safeIndex ? '20px' : '6px', height: '6px', background: i === safeIndex ? '#333' : 'rgba(0,0,0,0.15)' }}
                  onClick={() => { if (!isAnimating) { setCurrentIndex(i); setShowMenu(false); setShowTags(false); setEditingName(false) } }}
                />
              )
            })}
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex >= messages.length - 1 || isAnimating}
            className="p-2.5 rounded-full transition-all"
            style={{ background: currentIndex >= messages.length - 1 ? 'transparent' : 'rgba(0,0,0,0.06)', color: currentIndex >= messages.length - 1 ? '#ccc' : '#333', opacity: currentIndex >= messages.length - 1 ? 0.4 : 1 }}
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
