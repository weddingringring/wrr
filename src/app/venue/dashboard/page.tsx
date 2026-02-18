'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import EventCreateModal from '@/components/EventCreateModal'
import EventDetailsModal from '@/components/EventDetailsModal'
import ImpersonationBanner from '@/components/ImpersonationBanner'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAsId = searchParams.get('viewAs')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')
  const [filterEventType, setFilterEventType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false)
  
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
    router.push('/venue/login')
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
  
  const totalMessages = events.reduce((acc, e) => acc + e.messages_count, 0)
  
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
      {isImpersonating && venue && (
        <ImpersonationBanner label={venue.name} type="venue" />
      )}
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/venue/dashboard">
                <img 
                  src="/logo.png" 
                  alt="WeddingRingRing" 
                  className="h-8 w-auto"
                />
              </Link>
              {venue?.logo_url && (
                <>
                  <div className="border-l border-sage-light h-8"></div>
                  <img 
                    src={venue.logo_url} 
                    alt={venue.name}
                    className="h-8 w-auto object-contain"
                  />
                </>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center font-medium">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <span className="text-sm text-gray-900">
                    {user.first_name} {user.last_name}
                  </span>
                </div>
              )}
              <Link
                href="/venue/settings"
                className="text-sm text-sage-dark hover:text-charcoal transition"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-sage-dark hover:text-charcoal transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Upcoming Events</p>
            <p className="text-3xl font-bold text-deep-green">{upcomingEvents.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Past Events</p>
            <p className="text-3xl font-bold text-sage-dark">{pastEvents.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Total Messages</p>
            <p className="text-3xl font-bold text-charcoal">{totalMessages}</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-sage-dark mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or event type..."
                className="w-full px-4 py-2 rounded-lg border border-sage-light bg-white text-charcoal placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-xs text-sage-dark mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-sage-light bg-white text-charcoal"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-sage-dark mb-2">Event Type</label>
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-sage-light bg-white text-charcoal"
              >
                <option value="all">All Types</option>
                <option value="wedding">Weddings</option>
                <option value="birthday">Birthdays</option>
                <option value="anniversary">Anniversaries</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'calendar'
                  ? 'bg-deep-green text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'list'
                  ? 'bg-deep-green text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              📋 List
            </button>
          </div>
          
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
          >
            + Create Event
          </button>
        </div>
        
        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-6">Your Events</h2>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-sage-dark mb-2">
                  {events.length === 0 ? 'No events yet' : 'No events match your filters'}
                </p>
                <p className="text-sm text-sage-dark mb-6">
                  {events.length === 0 
                    ? 'Create your first event to get started' 
                    : 'Try adjusting your filters'}
                </p>
                {events.length === 0 && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-block px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                  >
                    + Create Event
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => {
                  const isPast = new Date(event.event_date) < new Date()
                  return (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      getDisplayName={getEventDisplayName} 
                      isPast={isPast}
                      onClick={() => {
                        setSelectedEvent(event)
                        setEventDetailsModalOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sage-light/20 border-b border-sage-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-light">
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="hover:bg-sage-light/10 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-charcoal">
                          {getEventDisplayName(event)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal">
                          {new Date(event.event_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal">
                          {event.messages_count} messages
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'active'
                            ? 'bg-deep-green/10 text-deep-green'
                            : 'bg-sage/10 text-sage-dark'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEvent(event)
                            setEventDetailsModalOpen(true)
                          }}
                          className="text-sm text-deep-green hover:text-deep-green-dark font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  
  return (
    <button
      onClick={onClick}
      className={`block p-6 rounded-xl border-2 transition hover:shadow-md w-full text-left ${
        isPast
          ? 'border-sage-light bg-sage-light/10 hover:border-sage'
          : 'border-deep-green/20 bg-white hover:border-deep-green'
      }`}
    >
      <div className="mb-3">
        <h4 className="font-serif text-lg text-charcoal mb-1">
          {getDisplayName(event)}
        </h4>
        <p className="text-sm text-sage-dark">
          {new Date(event.event_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
      
      {!isPast && daysUntil >= 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-deep-green">
            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-sage-dark">
          {event.messages_count} messages
        </span>
        <span className="text-deep-green font-medium">
          View →
        </span>
      </div>
    </button>
  )
}
