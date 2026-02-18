'use client'

import { Eye, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImpersonationBannerProps {
  label: string // e.g. "Thornbury Manor" or "Sarah & James's Wedding"
  type: 'venue' | 'customer'
}

export default function ImpersonationBanner({ label, type }: ImpersonationBannerProps) {
  const router = useRouter()

  return (
    <div style={{
      background: '#3D5A4C',
      color: 'white',
      padding: '0.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      fontSize: '0.8125rem',
      fontWeight: 500,
      zIndex: 200
    }}>
      <Eye size={14} />
      <span>
        Viewing {type === 'venue' ? 'venue' : 'customer'} dashboard as <strong>{label}</strong>
      </span>
      <button
        onClick={() => router.push('/admin/dashboard')}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginLeft: '0.5rem',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
      >
        <X size={12} />
        Back to Admin
      </button>
    </div>
  )
}
