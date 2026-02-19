'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Check, X } from 'lucide-react'

interface MessageSharePopoverProps {
  messageId: string
  callerName: string | null
  anchorRef: React.RefObject<HTMLElement>
  onClose: () => void
  onOpenStoryModal: () => void
  viewAsId?: string | null
}

export default function MessageSharePopover({
  messageId,
  callerName,
  anchorRef,
  onClose,
  onOpenStoryModal,
  viewAsId,
}: MessageSharePopoverProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Generate share link on mount
  useEffect(() => {
    const generate = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setError(true); return }

        const res = await fetch('/api/share/message-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messageId, viewAs: viewAsId || undefined }),
        })

        if (!res.ok) { setError(true); return }
        const data = await res.json()
        setShareUrl(data.shareUrl)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    generate()
  }, [messageId, viewAsId])

  // Close on click outside / ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose, anchorRef])

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleWhatsApp = () => {
    if (!shareUrl) return
    const name = callerName ? ` from ${callerName}` : ''
    const text = `We loved this message${name} from our special day 🤍 Listen here: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const displayUrl = shareUrl
    ? shareUrl.replace(/^https?:\/\//, '').split('?')[0]
    : ''

  // Compute fixed position from anchor element
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popWidth = 320
    const margin = 8

    // Position below the anchor, aligned to right edge
    let left = rect.right - popWidth
    // Keep on screen
    if (left < margin) left = margin
    if (left + popWidth > window.innerWidth - margin) left = window.innerWidth - popWidth - margin

    let top = rect.bottom + 8
    // If not enough room below, put above
    if (top + 300 > window.innerHeight) {
      top = rect.top - 8 // will be adjusted after render
    }

    setPos({ top, left })
  }, [anchorRef])

  useEffect(() => {
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition])

  if (!pos) return null

  const popover = (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: '320px',
        borderRadius: '14px',
        padding: '1.25rem',
        background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid rgba(180, 165, 140, 0.2)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', borderRadius: '6px', color: '#aaa',
        }}
      >
        <X size={14} />
      </button>

      {/* Title */}
      <p style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '1.05rem', fontWeight: 500, color: '#2c2418',
        margin: '0 0 0.25rem 0',
      }}>
        Share this message
      </p>
      <p style={{ fontSize: '0.75rem', color: '#8a7e6c', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
        Send this message privately to someone.
      </p>

      {/* Section: Private link */}
      <p style={{
        fontSize: '0.625rem', fontWeight: 600,
        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: '#a69d8e', margin: '0 0 0.5rem 0',
      }}>
        Private link
      </p>

      {loading ? (
        <div style={{
          padding: '0.75rem', borderRadius: '8px',
          background: 'rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '36px',
        }}>
          <div style={{ width: '14px', height: '14px', border: '1.5px solid rgba(0,0,0,0.08)', borderTopColor: '#587e6a', borderRadius: '50%', animation: 'mspin 0.7s linear infinite' }} />
          <style>{`@keyframes mspin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : error ? (
        <p style={{ fontSize: '0.75rem', color: '#c08585', margin: '0 0 0.5rem 0' }}>
          Unable to generate link. Please try again.
        </p>
      ) : (
        <>
          {/* URL display */}
          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px',
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.05)',
            marginBottom: '0.6rem',
          }}>
            <p style={{
              fontSize: '0.7rem', color: '#555',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              margin: 0,
            }}>
              {displayUrl}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 500,
                background: copied ? 'rgba(88, 126, 106, 0.08)' : 'rgba(0,0,0,0.04)',
                color: copied ? '#587e6a' : '#555',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>

            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 500,
                background: 'rgba(0,0,0,0.04)',
                color: '#555',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp
            </button>
          </div>
        </>
      )}

      {/* Divider */}
      <div style={{
        height: '1px', background: 'rgba(180, 165, 140, 0.15)',
        margin: '0 0 1rem 0',
      }} />

      {/* Section: Social sharing */}
      <p style={{
        fontSize: '0.625rem', fontWeight: 600,
        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: '#a69d8e', margin: '0 0 0.6rem 0',
      }}>
        Share to Instagram or TikTok
      </p>

      <button
        onClick={() => { onOpenStoryModal(); onClose() }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.6rem 1rem', borderRadius: '8px',
          fontSize: '0.8rem', fontWeight: 500,
          background: 'linear-gradient(135deg, #6b8f7b 0%, #587e6a 100%)',
          color: 'white',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(88, 126, 106, 0.2)',
          transition: 'all 0.15s ease',
        }}
      >
        Create story video
      </button>
      <p style={{ fontSize: '0.65rem', color: '#a69d8e', margin: '0.4rem 0 0 0', textAlign: 'center', lineHeight: 1.4 }}>
        A vertical video formatted for stories and reels.
      </p>
    </div>
  )

  return createPortal(popover, document.body)
}
