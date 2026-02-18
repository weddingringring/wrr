'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import EventCreateModal from '@/components/EventCreateModal'
import EventDetailsModal from '@/components/EventDetailsModal'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import { Calendar, CalendarDays, List, Plus, Search, Mic, Settings, LogOut, ChevronUp, ChevronDown, LayoutGrid } from 'lucide-react'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_first_name: string
  partner_1_last_name: string
  partner_2_first_name: string | null
  partner_2_last_name: string | null
  status: string
  messages_count: number
  venue_location?: string
  customer_email?: string
  customer_phone?: string
}

export default function VenueDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#F5E8E8' }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-green" /></div>}>
      <VenueDashboardContent />
    </Suspense>
  )
}

function VenueDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAsId = searchParams.get('viewAs')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')
  const [filterEventType, setFilterEventType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'messages' | 'status'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Persist view preference
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('wrr-venue-view') : null
    if (saved === 'calendar' || saved === 'list') setView(saved)
  }, [])

  const handleViewChange = (v: 'calendar' | 'list') => {
    setView(v)
    if (typeof window !== 'undefined') window.localStorage.setItem('wrr-venue-view', v)
  }

  const handleSort = (field: 'date' | 'messages' | 'status') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'date' ? 'desc' : 'asc')
    }
  }
  
  useEffect(() => {
    checkAuth()
    loadEvents()
  }, [])
  
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    // Check if this is a developer impersonation
    let targetUserId = user.id
    if (viewAsId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'developer') {
        targetUserId = viewAsId
        setIsImpersonating(true)
      }
    }
    
    // Get venue
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', targetUserId)
      .single()
    
    if (!venueData) {
      if (!viewAsId) {
        await supabase.auth.signOut()
        router.push('/')
      }
      return
    }
    
    // Get profile for the target user
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', targetUserId)
      .single()
    
    setUser(profile)
    setVenue(venueData)
  }
  
  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use impersonated user ID if developer is viewing as venue
      let targetUserId = user.id
      if (viewAsId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'developer') {
          targetUserId = viewAsId
        }
      }
      
      // Get venue first
      const { data: venueData } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', targetUserId)
        .single()
      
      if (!venueData) return
      
      // Get events for this venue
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          messages:messages(count)
        `)
        .eq('venue_id', venueData.id)
        .order('event_date', { ascending: false })
      
      if (error) throw error
      
      const eventsWithCount = data.map(event => ({
        ...event,
        messages_count: event.messages[0]?.count || 0
      }))
      
      setEvents(eventsWithCount || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  const getEventDisplayName = (event: Event) => {
    const partner1Name = `${event.partner_1_first_name} ${event.partner_1_last_name}`.trim()
    const partner2Name = event.partner_2_first_name && event.partner_2_last_name
      ? `${event.partner_2_first_name} ${event.partner_2_last_name}`.trim()
      : null
    
    if (event.event_type === 'wedding') {
      return partner2Name 
        ? `${partner1Name} & ${partner2Name}'s Wedding`
        : `${partner1Name}'s Wedding`
    }
    return `${partner1Name}'s ${event.event_type}`
  }
  
  const upcomingEvents = events.filter(e => 
    new Date(e.event_date) >= new Date() && e.status === 'active'
  )
  const pastEvents = events.filter(e => 
    new Date(e.event_date) < new Date() || e.status === 'completed'
  )
  
  // Apply filters
  const filteredEvents = events.filter(event => {
    // Status filter
    if (filterStatus === 'upcoming' && new Date(event.event_date) < new Date()) return false
    if (filterStatus === 'past' && new Date(event.event_date) >= new Date()) return false
    
    // Event type filter
    if (filterEventType !== 'all' && event.event_type !== filterEventType) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const partner1Name = `${event.partner_1_first_name} ${event.partner_1_last_name}`.toLowerCase()
      const partner2Name = event.partner_2_first_name && event.partner_2_last_name
        ? `${event.partner_2_first_name} ${event.partner_2_last_name}`.toLowerCase()
        : ''
      const eventType = event.event_type.toLowerCase()
      const email = event.customer_email?.toLowerCase() || ''
      
      const matches = partner1Name.includes(query) ||
                     partner2Name.includes(query) ||
                     eventType.includes(query) ||
                     email.includes(query)
      
      if (!matches) return false
    }
    
    return true
  })

  // Sort filtered events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'date') {
      return dir * (new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    }
    if (sortField === 'messages') {
      return dir * (a.messages_count - b.messages_count)
    }
    if (sortField === 'status') {
      return dir * a.status.localeCompare(b.status)
    }
    return 0
  })

  const totalMessages = events.reduce((acc, e) => acc + e.messages_count, 0)

  const getMessageColor = (count: number) => {
    if (count === 0) return 'text-sage-dark/50'
    if (count >= 10) return 'text-deep-green font-semibold'
    return 'text-charcoal'
  }

  const SortIndicator = ({ field }: { field: 'date' | 'messages' | 'status' }) => (
    <span className="inline-flex flex-col ml-1" style={{ lineHeight: 0, verticalAlign: 'middle' }}>
      <ChevronUp size={10} className={sortField === field && sortDir === 'asc' ? 'text-charcoal' : 'text-sage-light'} style={{ marginBottom: '-2px' }} />
      <ChevronDown size={10} className={sortField === field && sortDir === 'desc' ? 'text-charcoal' : 'text-sage-light'} />
    </span>
  )
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5E8E8' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen" style={{ background: '#F5E8E8' }}>
      {isImpersonating && venue && (
        <ImpersonationBanner label={venue.name} type="venue" />
      )}
      {/* Header */}
      <header style={{
        background: '#F5E8E8',
        padding: '0.875rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="flex items-center gap-4">
            <Link href="/venue/dashboard">
              <Image 
                src="/logo.png" 
                alt="WeddingRingRing" 
                width={400} 
                height={100} 
                priority 
                style={{ maxWidth: '180px', height: 'auto' }}
              />
            </Link>
            {venue?.logo_url && (
              <>
                <div style={{ width: '1px', height: '2rem', background: 'rgba(0,0,0,0.12)' }} />
                <img 
                  src={venue.logo_url} 
                  alt={venue.name}
                  style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
                />
              </>
            )}
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center text-xs font-medium">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                  {user.first_name} {user.last_name}
                </span>
              </div>
            )}
            <div style={{ width: '1px', height: '1.25rem', background: 'rgba(0,0,0,0.15)' }} />
            <Link href="/venue/settings" style={{ color: '#1a1a1a', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: 0.7, transition: 'all 0.2s' }}>
              <Settings size={15} />
              Settings
            </Link>
            <button onClick={handleSignOut} style={{ color: '#6a6a6a', fontWeight: 500, fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: 0, transition: 'all 0.2s' }}>
              <LogOut size={15} />
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl" style={{ color: '#111' }}>{venue?.name || 'Venue Dashboard'}</h1>
          <p className="text-sm mt-1" style={{ color: '#777' }}>Welcome back, {user?.first_name}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#999', fontWeight: 500 }}>Upcoming Events</p>
                <p className="font-bold mb-0.5" style={{ fontSize: '2.25rem', lineHeight: 1, color: '#111' }}>{upcomingEvents.length}</p>
                <p className="text-xs" style={{ color: '#999' }}>{events.length} total</p>
              </div>
              <div className="p-2 rounded-lg bg-deep-green/8">
                <CalendarDays size={20} className="text-deep-green" style={{ opacity: 0.6 }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#999', fontWeight: 500 }}>Past Events</p>
                <p className="font-bold mb-0.5" style={{ fontSize: '2.25rem', lineHeight: 1, color: '#111' }}>{pastEvents.length}</p>
                <p className="text-xs" style={{ color: '#999' }}>Completed</p>
              </div>
              <div className="p-2 rounded-lg bg-sage/8">
                <Calendar size={20} className="text-sage-dark" style={{ opacity: 0.5 }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#999', fontWeight: 500 }}>Total Messages</p>
                <p className="font-bold mb-0.5" style={{ fontSize: '2.25rem', lineHeight: 1, color: '#111' }}>{totalMessages.toLocaleString()}</p>
                <p className="text-xs" style={{ color: '#999' }}>All time</p>
              </div>
              <div className="p-2 rounded-lg bg-rose/8">
                <Mic size={20} className="text-rose-dark" style={{ opacity: 0.5 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        <div className="mb-6">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ border: 'none', cursor: 'pointer', padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
          >
            <Plus size={18} />
            Create New Event
          </button>
          <p style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '0.375rem' }}>Add a new couple and event details.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#bbb' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent"
                style={{ borderColor: '#e0e0e0', background: '#fff' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent"
              style={{ borderColor: '#e0e0e0' }}
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent"
              style={{ borderColor: '#e0e0e0' }}
            >
              <option value="all">All Types</option>
              <option value="wedding">Weddings</option>
              <option value="birthday">Birthdays</option>
              <option value="anniversary">Anniversaries</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex rounded-md overflow-hidden border" style={{ borderColor: '#ddd' }}>
            <button
              onClick={() => handleViewChange('list')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition ${
                view === 'list'
                  ? 'bg-charcoal text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{ border: 'none', cursor: 'pointer', color: view === 'list' ? '#fff' : '#888', fontWeight: 500 }}
            >
              <List size={13} />
              List
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition ${
                view === 'calendar'
                  ? 'bg-charcoal text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{ border: 'none', borderLeft: '1px solid #ddd', cursor: 'pointer', color: view === 'calendar' ? '#fff' : '#888', fontWeight: 500 }}
            >
              <LayoutGrid size={13} />
              Cards
            </button>
          </div>
        </div>

        {/* Content */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center">
            <p style={{ color: '#666' }} className="text-sm mb-1">
              {events.length === 0 ? 'No events yet' : 'No events match your filters'}
            </p>
            <p className="text-xs mb-5" style={{ color: '#aaa' }}>
              {events.length === 0 
                ? 'Use the Create New Event button above to get started' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : view === 'list' ? (
          /* ─── LIST VIEW ─── */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #e8e8e8' }}>
                    <th className="pl-5 pr-3 py-2 text-left uppercase tracking-wider select-none" style={{ color: '#aaa', fontSize: '0.6875rem', fontWeight: 500 }}>Event</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wider cursor-pointer select-none" style={{ color: '#aaa', fontSize: '0.6875rem', fontWeight: 500, width: '120px' }} onClick={() => handleSort('date')}>
                      Date <SortIndicator field="date" />
                    </th>
                    <th className="px-3 py-2 text-left uppercase tracking-wider cursor-pointer select-none" style={{ color: '#aaa', fontSize: '0.6875rem', fontWeight: 500, width: '90px' }} onClick={() => handleSort('messages')}>
                      Messages <SortIndicator field="messages" />
                    </th>
                    <th className="px-3 py-2 text-left uppercase tracking-wider cursor-pointer select-none" style={{ color: '#aaa', fontSize: '0.6875rem', fontWeight: 500, width: '100px' }} onClick={() => handleSort('status')}>
                      Status <SortIndicator field="status" />
                    </th>
                    <th className="px-5 py-2 text-right uppercase tracking-wider select-none" style={{ color: '#aaa', fontSize: '0.6875rem', fontWeight: 500, width: '100px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event, idx) => (
                    <tr
                      key={event.id}
                      onClick={() => { setSelectedEvent(event); setEventDetailsModalOpen(true) }}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: idx % 2 === 1 ? '#fcfcfc' : '#fff',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#fcfcfc' : '#fff' }}
                    >
                      <td className="pl-5 pr-3 py-2">
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1.3 }}>{getEventDisplayName(event)}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#c0c0c0', marginTop: '2px', letterSpacing: '0.01em' }}>{event.customer_email}</div>
                      </td>
                      <td className="px-3 py-2" style={{ fontSize: '0.8125rem', color: '#444' }}>
                        {new Date(event.event_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`${getMessageColor(event.messages_count)}`} style={{ fontSize: '0.8125rem' }}>
                          {event.messages_count}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          letterSpacing: '0.02em',
                          background: event.status === 'active' ? 'rgba(61,90,76,0.08)' : event.status === 'completed' ? 'rgba(140,160,140,0.1)' : 'rgba(200,100,100,0.08)',
                          color: event.status === 'active' ? '#3D5A4C' : event.status === 'completed' ? '#7a8a7a' : '#b05050',
                        }}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right">
                        <span
                          className="text-deep-green hover:text-deep-green-dark font-medium"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          View Details
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ─── CARD VIEW ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sortedEvents.map(event => {
              const isPast = new Date(event.event_date) < new Date()
              return (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  getDisplayName={getEventDisplayName} 
                  isPast={isPast}
                  onClick={() => { setSelectedEvent(event); setEventDetailsModalOpen(true) }}
                />
              )
            })}
          </div>
        )}
      </div>
      
      {/* Event Create Modal */}
      <EventCreateModal 
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadEvents() // Reload events after creating
        }}
      />
      
      {/* Event Details Modal */}
      <EventDetailsModal 
        isOpen={eventDetailsModalOpen}
        onClose={() => {
          setEventDetailsModalOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
      />
    </div>
  )
}

// Event Card Component
function EventCard({ event, getDisplayName, isPast = false, onClick }: {
  event: Event
  getDisplayName: (event: Event) => string
  isPast?: boolean
  onClick: () => void
}) {
  const daysUntil = Math.ceil(
    (new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const msgCount = event.messages_count
  
  return (
    <button
      onClick={onClick}
      className={`block p-4.5 border transition hover:shadow-md w-full text-left ${
        isPast
          ? 'border-gray-200 bg-white/70 hover:border-gray-300'
          : 'border-deep-green/12 bg-white hover:border-deep-green/35'
      }`}
      style={{ cursor: 'pointer', borderRadius: '8px', padding: '1.125rem' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-serif mb-0.5" style={{ color: '#0d0d0d', fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.3 }}>
            {getDisplayName(event)}
          </h4>
          <p style={{ color: '#aaa', fontSize: '0.75rem' }}>
            {new Date(event.event_date).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
        {!isPast && daysUntil >= 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '0.6875rem',
            fontWeight: 500,
            background: daysUntil <= 7 ? 'rgba(61,90,76,0.1)' : 'rgba(61,90,76,0.06)',
            color: '#3D5A4C',
            whiteSpace: 'nowrap',
          }}>
            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil}d`}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid #f0f0f0' }}>
        <span style={{
          fontSize: '0.8125rem',
          color: msgCount === 0 ? '#ccc' : msgCount >= 10 ? '#3D5A4C' : '#555',
          fontWeight: msgCount >= 10 ? 600 : msgCount === 0 ? 400 : 500,
        }}>
          {msgCount} {msgCount === 1 ? 'message' : 'messages'}
        </span>
        <span className="text-deep-green" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
          View →
        </span>
      </div>
    </button>
  )
}
