'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LogOut, LayoutDashboard, Building2, Calendar, Phone, AlertTriangle } from 'lucide-react'

interface AdminHeaderProps {
  currentPage?: 'dashboard' | 'venues' | 'events' | 'phones' | 'errors' | 'other'
}

export default function AdminHeader({ currentPage = 'dashboard' }: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'venues', label: 'Venues', href: '/admin/venues', icon: Building2 },
    { key: 'events', label: 'Events', href: '/admin/events', icon: Calendar },
    { key: 'phones', label: 'Phones', href: '/admin/phones', icon: Phone },
    { key: 'errors', label: 'Errors', href: '/admin/error-logs', icon: AlertTriangle },
  ]

  return (
    <header style={{
      background: '#F5E8E8',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Link href="/admin/dashboard">
          <Image 
            src="/logo.png" 
            alt="WeddingRingRing" 
            width={400} 
            height={100} 
            priority 
            style={{
              maxWidth: '160px',
              height: 'auto'
            }}
          />
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  color: isActive ? '#3D5A4C' : '#1a1a1a',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  opacity: isActive ? 1 : 0.7,
                  transition: 'all 0.2s',
                  borderBottom: isActive ? '2px solid #3D5A4C' : '2px solid transparent',
                  paddingBottom: '0.125rem'
                }}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}

          <div style={{ width: '1px', height: '1.25rem', background: 'rgba(0,0,0,0.15)', margin: '0 0.25rem' }} />

          <button
            onClick={handleSignOut}
            style={{
              color: '#6a6a6a',
              fontWeight: 500,
              fontSize: '0.8125rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: 0,
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  )
}
