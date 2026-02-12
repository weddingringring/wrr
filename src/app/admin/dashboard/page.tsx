'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import VenueCreateModal from '@/components/VenueCreateModal'

interface DashboardStats {
  totalVenues: number
  activeVenues: number
  totalEvents: number
  upcomingEvents: number
  totalMessages: number
  totalPhones: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  
  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])
  
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/admin/login')
      return
    }
    
    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      router.push('/admin/login')
      return
    }
    
    setUser(profile)
  }
  
  const loadStats = async () => {
    try {
      // Get all stats in parallel
      const [venues, activeVenues, events, upcomingEvents, messages, phones] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('phones').select('id', { count: 'exact', head: true })
      ])
      
      setStats({
        totalVenues: venues.count || 0,
        activeVenues: activeVenues.count || 0,
        totalEvents: events.count || 0,
        upcomingEvents: upcomingEvents.count || 0,
        totalMessages: messages.count || 0,
        totalPhones: phones.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl text-charcoal">Admin Dashboard</h1>
              <p className="text-sm text-sage-dark mt-1">Welcome back, {user?.full_name}</p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-sage-dark hover:text-charcoal transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Venues"
            value={stats?.totalVenues || 0}
            subtitle={`${stats?.activeVenues || 0} active`}
            icon="🏛️"
            color="deep-green"
          />
          
          <StatCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            subtitle={`${stats?.upcomingEvents || 0} upcoming`}
            icon="📅"
            color="sage"
          />
          
          <StatCard
            title="Messages Recorded"
            value={stats?.totalMessages || 0}
            subtitle="All time"
            icon="🎤"
            color="rose"
          />
          
          <StatCard
            title="Phone Inventory"
            value={stats?.totalPhones || 0}
            subtitle="Total devices"
            icon="📞"
            color="gold"
          />
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="font-serif text-2xl text-charcoal mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              onClick={() => setVenueModalOpen(true)}
              icon="+"
              label="Add Venue"
              color="deep-green"
            />
            
            <ActionButton
              href="/admin/events/create"
              icon="📅"
              label="Create Event"
              color="sage"
            />
            
            <ActionButton
              href="/admin/phones/create"
              icon="📞"
              label="Add Phone"
              color="rose"
            />
            
            <ActionButton
              href="/admin/venues"
              icon="👁️"
              label="View All Venues"
              color="gold"
            />
          </div>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NavCard
            href="/admin/venues"
            title="Venues"
            description="Manage venue accounts and settings"
            icon="🏛️"
          />
          
          <NavCard
            href="/admin/events"
            title="Events"
            description="View and manage all events"
            icon="📅"
          />
          
          <NavCard
            href="/admin/phones"
            title="Phone Inventory"
            description="Track physical phone devices"
            icon="📞"
          />
        </div>
      </div>

      {/* Venue Create Modal */}
      <VenueCreateModal 
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSuccess={() => {
          loadStats() // Reload stats after venue created
        }}
      />
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: number
  subtitle: string
  icon: string
  color: string
}) {
  const colorClasses = {
    'deep-green': 'bg-deep-green/10 text-deep-green',
    'sage': 'bg-sage/10 text-sage-dark',
    'rose': 'bg-rose/10 text-rose-dark',
    'gold': 'bg-gold/10 text-gold'
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-sage-dark mb-1">{title}</p>
          <p className="text-3xl font-bold text-charcoal mb-1">{value.toLocaleString()}</p>
          <p className="text-xs text-sage-dark">{subtitle}</p>
        </div>
        <div className={`text-3xl ${colorClasses[color as keyof typeof colorClasses] || ''}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Action Button Component
function ActionButton({ href, onClick, icon, label, color }: {
  href?: string
  onClick?: () => void
  icon: string
  label: string
  color: string
}) {
  const colorClasses = {
    'deep-green': 'bg-deep-green hover:bg-deep-green-dark',
    'sage': 'bg-sage hover:bg-sage-dark',
    'rose': 'bg-rose hover:bg-rose-dark',
    'gold': 'bg-gold hover:bg-charcoal'
  }
  
  const className = `${colorClasses[color as keyof typeof colorClasses]} text-white rounded-lg p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer`
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={className}
        style={{ border: 'none', width: '100%' }}
      >
        <span className="text-2xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </button>
    )
  }
  
  return (
    <Link
      href={href!}
      className={className}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}

// Navigation Card Component
function NavCard({ href, title, description, icon }: {
  href: string
  title: string
  description: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-serif text-xl text-charcoal mb-2 group-hover:text-deep-green transition">
        {title}
      </h3>
      <p className="text-sm text-sage-dark">{description}</p>
    </Link>
  )
}
