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
  const startPos = useRef({ x: 0, y: 0 })

  const len = messages.length
  const wrap = (i: number) => ((i % len) + len) % len

  const safeIndex = len > 0 ? wrap(currentIndex) : 0

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

  const resetUI = () => {
    setShowMenu(false)
    setShowTags(false)
    setEditingName(false)
  }

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
      resetUI()
      setTimeout(() => {
        if (direction === 'left') setCurrentIndex(i => i + 1)
        else setCurrentIndex(i => i - 1)
        setExitDirection(null)
        setDragX(0)
        setDragY(0)
        setIsAnimating(false)
      }, 300)
    } else {
      setDragX(0)
      setDragY(0)
    }
  }

  const goNext = () => {
    if (isAnimating) return
    setExitDirection('left')
    setIsAnimating(true)
    resetUI()
    setTimeout(() => {
      setCurrentIndex(i => i + 1)
      setExitDirection(null)
      setDragX(0)
      setDragY(0)
      setIsAnimating(false)
    }, 300)
  }

  const goPrev = () => {
    if (isAnimating) return
    setExitDirection('right')
    setIsAnimating(true)
    resetUI()
    setTimeout(() => {
      setCurrentIndex(i => i - 1)
      setExitDirection(null)
      setDragX(0)
      setDragY(0)
      setIsAnimating(false)
    }, 300)
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

  const renderStaticContent = (m: Message) => {
    const photo = getPhotoUrl(m)
    const dur = m.duration_seconds || m.duration || 0
    const f = m.is_favorite || m.is_favorited || false
    return (
      <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          {photo ? (
            <div className="photo-frame">
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                <img src={photo} alt={m.caller_name || 'Guest'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          ) : (
            <div className="photo-frame">
              <div style={{ aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)' }}>
                  <ImageIcon size={22} style={{ color: '#999' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#999' }}>Tap to add photo</span>
              </div>
            </div>
          )}
        </div>
        <div className="card-name" style={{ fontSize: '24px', lineHeight: 1.2, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.caller_name || <span style={{ fontFamily: 'inherit', color: '#aaa', fontStyle: 'italic', fontSize: '18px' }}>Unknown guest</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#777' }}>
          <span>{formatDate(m.recorded_at || m.created_at)}</span>
          <span style={{ color: '#ccc' }}>&middot;</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} strokeWidth={1.5} style={{ color: '#999' }} />
            {formatDuration(dur)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)' }}>
            <Play size={20} fill="white" stroke="white" style={{ marginLeft: '2px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.08)' }}></div>
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#999' }}>{formatDuration(dur)}</span>
        </div>
        <div style={{ margin: '12px 0', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent 100%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ padding: '4px' }}><Heart size={18} fill={f ? '#C08585' : 'none'} stroke={f ? '#C08585' : '#bbb'} strokeWidth={1.5} /></div>
            <div style={{ padding: '4px' }}><Tag size={15} style={{ color: '#999' }} /></div>
            {m.tags && m.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                {m.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.05)', color: '#666', border: '1px solid rgba(0,0,0,0.08)' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ padding: '8px' }}><Download size={16} style={{ color: '#999' }} /></div>
            <div style={{ padding: '8px' }}><Share2 size={16} style={{ color: '#999' }} /></div>
          </div>
        </div>
      </div>
    )
  }

  if (len === 0) return null
  const msg = messages[safeIndex]
  if (!msg) return null

  const fav = msg.is_favorite || msg.is_favorited || false
  const duration = msg.duration_seconds || msg.duration || 0
  const progress = playbackProgress[msg.id] || 0
  const isPlaying = currentlyPlaying === msg.id
  const photoUrl = getPhotoUrl(msg)
  const activeRot = getCardRotation(safeIndex)
  const activeOff = getCardOffset(safeIndex)

  // Build the pile: 2 before, 2 after (wrapped), excluding active
  const pileIndices: number[] = []
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue
    const idx = wrap(safeIndex + offset)
    if (!pileIndices.includes(idx)) pileIndices.push(idx)
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Oooh+Baby&display=swap" rel="stylesheet" />

      <style>{`
        .parchment-card {
          background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07), inset 0 0 60px rgba(255,252,240,0.5);
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', perspective: '1000px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>

            {/* Pile cards - static, no transitions, always in position */}
            {pileIndices.map(idx => {
              const pileMsg = messages[idx]
              if (!pileMsg) return null
              const rot = getCardRotation(idx)
              const off = getCardOffset(idx)
              const distFromActive = Math.min(
                Math.abs(idx - safeIndex),
                Math.abs(idx - safeIndex + len),
                Math.abs(idx - safeIndex - len)
              )
              return (
                <div
                  key={`pile-${idx}`}
                  className="parchment-card"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transform: `rotate(${rot}deg) translate(${off.x}px, ${off.y}px)`,
                    zIndex: 10 - distFromActive,
                    opacity: 1 - distFromActive * 0.05,
                  }}
                >
                  {renderStaticContent(pileMsg)}
                </div>
              )
            })}

            {/* Active card - matches its pile rotation/offset, animates only on drag/exit */}
            <div
              className="parchment-card"
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '12px',
                zIndex: 20,
                transform: exitDirection === 'left'
                  ? 'translateX(-120%) rotate(-15deg)'
                  : exitDirection === 'right'
                    ? 'translateX(120%) rotate(15deg)'
                    : `translate(${activeOff.x + dragX}px, ${activeOff.y + dragY}px) rotate(${activeRot + dragX * 0.05}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'none',
                cursor: editingName || showMenu || showTags ? 'default' : 'grab',
                userSelect: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
                {/* Photo area */}
                <div style={{ marginBottom: '16px' }}>
                  {photoUrl ? (
                    <div className="photo-frame">
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                        <img src={photoUrl} alt={msg.caller_name || 'Guest'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (filter !== 'trash') onPhotoUpload(msg.id) }}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <div className="photo-frame">
                        <div style={{ aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)' }}>
                            <ImageIcon size={22} style={{ color: '#999' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#999' }}>Tap to add photo</span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Name + menu */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editNameValue.trim()) { onUpdateName(msg.id, editNameValue.trim()); setEditingName(false) }
                            if (e.key === 'Escape') setEditingName(false)
                          }}
                          style={{ fontSize: '24px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', color: '#1a1a1a', fontFamily: "'Oooh Baby', cursive", width: '100%', outline: 'none' }}
                          autoFocus
                        />
                        <button onClick={() => { if (editNameValue.trim()) { onUpdateName(msg.id, editNameValue.trim()); setEditingName(false) } }} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Check size={14} style={{ color: '#333' }} />
                        </button>
                        <button onClick={() => setEditingName(false)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <X size={14} style={{ color: '#999' }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (filter !== 'trash') { setEditNameValue(msg.caller_name || ''); setEditingName(true) } }}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <div className="card-name" style={{ fontSize: '24px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.caller_name || (
                            <span style={{ fontFamily: 'inherit', color: '#aaa', fontStyle: 'italic', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={16} /> Tap to add name
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  {filter === 'trash' ? (
                    <button onClick={(e) => { e.stopPropagation(); onRestore(msg.id) }} onPointerDown={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px', color: '#333', background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <Undo2 size={14} /> Restore
                    </button>
                  ) : (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowTags(false) }} onPointerDown={(e) => e.stopPropagation()} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <MoreHorizontal size={18} style={{ color: '#999' }} />
                      </button>
                      {showMenu && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)}></div>
                          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px 0', zIndex: 20, border: '1px solid #e0e0e0', minWidth: '160px' }}>
                            <button onClick={() => { onPhotoUpload(msg.id); setShowMenu(false) }} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '14px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ImageIcon size={14} /> {msg.guest_photo_url ? 'Change photo' : 'Add photo'}
                            </button>
                            <button onClick={() => { onShare(msg.recording_url, msg.caller_name); setShowMenu(false) }} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '14px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Share2 size={14} /> Share
                            </button>
                            <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                            <button onClick={() => { onSoftDelete(msg.id); setShowMenu(false) }} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '14px', color: '#C08585', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Date + duration */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#777' }}>
                  <span>{formatDate(msg.recorded_at || msg.created_at)}</span>
                  <span style={{ color: '#ccc' }}>&middot;</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} strokeWidth={1.5} style={{ color: '#999' }} />
                    {formatDuration(duration)}
                  </span>
                </div>

                {/* Notes */}
                {msg.notes && (
                  <p style={{ fontSize: '14px', marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', color: '#666' }}>{msg.notes}</p>
                )}

                {/* Play + progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="card-play"
                    style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); onPlay(msg.id, msg.recording_url) }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {isPlaying ? <Pause size={20} fill="white" stroke="white" /> : <Play size={20} fill="white" stroke="white" style={{ marginLeft: '2px' }} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(0,0,0,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: '3px', transition: 'width 0.1s', width: `${progress}%`, background: isPlaying ? '#D4A5A5' : '#333' }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#999' }}>{formatDuration(duration)}</span>
                </div>

                {/* Divider */}
                <div style={{ margin: '12px 0', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent 100%)' }} />

                {/* Bottom bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {filter === 'trash' ? (
                    <button onClick={(e) => { e.stopPropagation(); onRestore(msg.id) }} onPointerDown={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#333', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Undo2 size={14} /> Restore
                    </button>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(msg.id, fav) }} onPointerDown={(e) => e.stopPropagation()} style={{ flexShrink: 0, padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Heart size={18} fill={fav ? '#C08585' : 'none'} stroke={fav ? '#C08585' : '#bbb'} strokeWidth={1.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); setShowMenu(false) }} onPointerDown={(e) => e.stopPropagation()} style={{ flexShrink: 0, padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit tags">
                          <Tag size={15} style={{ color: '#999' }} />
                        </button>
                        {msg.tags && msg.tags.length > 0 && !showTags && (
                          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
                            {msg.tags.map(tag => (
                              <span key={tag} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0, background: 'rgba(0,0,0,0.05)', color: '#666', border: '1px solid rgba(0,0,0,0.08)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); onDownload(msg.recording_url, msg.caller_name) }} onPointerDown={(e) => e.stopPropagation()} style={{ padding: '8px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }} title="Download">
                          <Download size={16} style={{ color: '#999' }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onShare(msg.recording_url, msg.caller_name) }} onPointerDown={(e) => e.stopPropagation()} style={{ padding: '8px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }} title="Share">
                          <Share2 size={16} style={{ color: '#999' }} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Tag editor */}
                {showTags && (
                  <div style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {AVAILABLE_TAGS.map(tag => (
                        <button key={tag} onClick={() => onToggleTag(msg.id, tag)}
                          style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: (msg.tags || []).includes(tag) ? '#333' : 'white', color: (msg.tags || []).includes(tag) ? 'white' : '#666', border: '1px solid', borderColor: (msg.tags || []).includes(tag) ? '#333' : '#ddd' }}
                        >{tag}</button>
                      ))}
                    </div>
                    <button onClick={() => setShowTags(false)} style={{ marginTop: '8px', fontSize: '12px', fontWeight: 500, color: '#333', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
          <button
            onClick={goPrev}
            disabled={isAnimating}
            style={{ padding: '10px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', color: '#333', border: 'none', cursor: 'pointer', opacity: isAnimating ? 0.4 : 1 }}
          >
            <SkipBack size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {messages.map((_, i) => {
              const dist = Math.min(
                Math.abs(i - safeIndex),
                Math.abs(i - safeIndex + len),
                Math.abs(i - safeIndex - len)
              )
              if (dist > 3 && i !== 0 && i !== len - 1) return null
              if (dist === 3 && i !== 0 && i !== len - 1) {
                return <span key={i} style={{ fontSize: '12px', color: '#ccc' }}>·</span>
              }
              return (
                <div
                  key={i}
                  style={{
                    width: i === safeIndex ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    background: i === safeIndex ? '#333' : 'rgba(0,0,0,0.15)',
                  }}
                  onClick={() => { if (!isAnimating) { setCurrentIndex(i); resetUI() } }}
                />
              )
            })}
          </div>

          <button
            onClick={goNext}
            disabled={isAnimating}
            style={{ padding: '10px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', color: '#333', border: 'none', cursor: 'pointer', opacity: isAnimating ? 0.4 : 1 }}
          >
            <SkipForward size={20} />
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#b0a898' }}>
          Swipe or use arrows to browse
        </p>
      </div>
    </>
  )
}
