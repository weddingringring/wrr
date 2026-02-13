'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import EventCreateModal from '@/components/EventCreateModal'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_name: string
  partner_2_name: string | null
  status: string
  messages_count: number
}

export default function VenueDashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  
  useEffect(() => {
    checkAuth()
    loadEvents()
  }, [])
  
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/venue/login')
      return
    }
    
    // Get venue
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    
    if (!venueData) {
      await supabase.auth.signOut()
      router.push('/venue/login')
      return
    }
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()
    
    setUser(profile)
    setVenue(venueData)
  }
  
  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get venue first
      const { data: venueData } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id)
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
    if (event.event_type === 'wedding') {
      return event.partner_2_name 
        ? `${event.partner_1_name} & ${event.partner_2_name}'s Wedding`
        : `${event.partner_1_name}'s Wedding`
    }
    return `${event.partner_1_name}'s ${event.event_type}`
  }
  
  const upcomingEvents = events.filter(e => 
    new Date(e.event_date) >= new Date() && e.status === 'active'
  )
  const pastEvents = events.filter(e => 
    new Date(e.event_date) < new Date() || e.status === 'completed'
  )
  
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
              <div className="border-l border-sage-light pl-3">
                <p className="text-xs text-sage-dark">{venue?.name}</p>
              </div>
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
            
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-sage-dark mb-2">No events yet</p>
                <p className="text-sm text-sage-dark mb-6">Create your first event to get started</p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-block px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                >
                  + Create Event
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                  <div>
                    <h3 className="font-medium text-charcoal mb-4 text-lg">
                      Upcoming Events ({upcomingEvents.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} getDisplayName={getEventDisplayName} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Past Events */}
                {pastEvents.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sage-dark mb-4 text-lg">
                      Past Events ({pastEvents.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pastEvents.slice(0, 6).map(event => (
                        <EventCard key={event.id} event={event} getDisplayName={getEventDisplayName} isPast />
                      ))}
                    </div>
                  </div>
                )}
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
                  {events.map(event => (
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
                        <Link
                          href={`/venue/events/${event.id}`}
                          className="text-sm text-deep-green hover:text-deep-green-dark font-medium"
                        >
                          View Details
                        </Link>
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
    </div>
  )
}

// Event Card Component
function EventCard({ event, getDisplayName, isPast = false }: {
  event: Event
  getDisplayName: (event: Event) => string
  isPast?: boolean
}) {
  const daysUntil = Math.ceil(
    (new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  
  return (
    <Link
      href={`/venue/events/${event.id}`}
      className={`block p-6 rounded-xl border-2 transition hover:shadow-md ${
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
    </Link>
  )
}
