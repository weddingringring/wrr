'use client'

import { ReactNode } from 'react'

interface ParchmentCardProps {
  children: ReactNode
  className?: string
  maxWidth?: string
  padding?: string
}

export default function ParchmentCard({
  children,
  className = '',
  maxWidth = '440px',
  padding = '2.5rem 2.25rem',
}: ParchmentCardProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        maxWidth,
        width: '100%',
        margin: '0 auto',
        padding,
        background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%)',
        borderRadius: '1rem',
        boxShadow: '0 2px 8px rgba(120,100,70,0.06), 0 8px 32px rgba(120,100,70,0.08)',
        border: '1px solid rgba(180,165,140,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Paper texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'f\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65 0.2\' numOctaves=\'4\' seed=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23f)\'/%3E%3C/svg%3E")',
          opacity: 0.025,
          mixBlendMode: 'multiply' as const,
          pointerEvents: 'none' as const,
        }}
      />
      {/* Warm edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: '1px solid rgba(180,165,140,0.12)',
          pointerEvents: 'none' as const,
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
