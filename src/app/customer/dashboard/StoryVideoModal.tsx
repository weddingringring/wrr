'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface StoryVideoModalProps {
  callerName: string | null
  onClose: () => void
}

export default function StoryVideoModal({ callerName, onClose }: StoryVideoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '380px',
        borderRadius: '16px', padding: '2rem 1.75rem',
        background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        border: '1px solid rgba(180, 165, 140, 0.2)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', color: '#aaa',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.15rem', fontWeight: 500, color: '#2c2418',
          margin: '0 0 1.5rem 0', textAlign: 'center',
        }}>
          Preview your story
        </p>

        {/* 9:16 preview frame */}
        <div style={{
          width: '180px', margin: '0 auto 1.5rem auto',
          aspectRatio: '9/16',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(180, 165, 140, 0.15)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          {/* Placeholder icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(88, 126, 106, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#587e6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '0.8rem', color: '#8a7e6c', textAlign: 'center',
            lineHeight: 1.5, margin: 0,
          }}>
            Story preview<br />coming soon
          </p>
        </div>

        {/* Info text */}
        <p style={{
          fontSize: '0.7rem', color: '#a69d8e', textAlign: 'center',
          lineHeight: 1.6, margin: '0 0 1.25rem 0',
        }}>
          Story video generation will be available soon.
          {callerName ? ` You'll be able to create a beautiful video of ${callerName}'s message.` : ''}
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.6rem', borderRadius: '8px',
            fontSize: '0.8rem', fontWeight: 500,
            background: 'linear-gradient(135deg, #6b8f7b 0%, #587e6a 100%)',
            color: 'white',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(88, 126, 106, 0.2)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
