'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_name: string
  partner_2_name: string | null
  customer_email: string
  twilio_phone_number: string | null
  status: string
  venue: {
    name: string
    city: string
  }
  messages_count: number
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'upcoming' | 'past'>('all')
  
  useEffect(() => {
    loadEvents()
  }, [])
  
  useEffect(() => {
    filterEvents()
  }, [searchQuery, filterStatus, filterTimeframe, events])
  
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(name, city),
          messages:messages(count)
        `)
        .order('event_date', { ascending: false })
      
      if (error) throw error
      
      // Transform data to include message count
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
  
  const filterEvents = () => {
    let filtered = [...events]
    const today = new Date().toISOString().split('T')[0]
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus)
    }
    
    // Apply timeframe filter
    if (filterTimeframe === 'upcoming') {
      filtered = filtered.filter(e => e.event_date >= today)
    } else if (filterTimeframe === 'past') {
      filtered = filtered.filter(e => e.event_date < today)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.partner_1_name?.toLowerCase().includes(query) ||
        e.partner_2_name?.toLowerCase().includes(query) ||
        e.customer_email?.toLowerCase().includes(query) ||
        e.venue?.name?.toLowerCase().includes(query) ||
        e.twilio_phone_number?.includes(query)
      )
    }
    
    setFilteredEvents(filtered)
  }
  
  const getEventDisplayName = (event: Event) => {
    if (event.event_type === 'wedding') {
      return event.partner_2_name 
        ? `${event.partner_1_name} & ${event.partner_2_name}'s Wedding`
        : `${event.partner_1_name}'s Wedding`
    }
    return `${event.partner_1_name}'s ${event.event_type}`
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading events...</p>
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
              <Link href="/admin/dashboard" className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="font-serif text-3xl text-charcoal">Events</h1>
            </div>
            
            <Link
              href="/admin/events/create"
              className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            >
              + Create Event
            </Link>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Names, venue, email, phone..."
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Timeframe
              </label>
              <select
                value={filterTimeframe}
                onChange={(e) => setFilterTimeframe(e.target.value as any)}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-sage-dark">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>
        
        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-sage-dark mb-2">No events found</p>
              <p className="text-sm text-sage-dark mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Create your first event to get started'}
              </p>
              {!searchQuery && (
                <Link
                  href="/admin/events/create"
                  className="inline-block px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                >
                  + Create Event
                </Link>
              )}
            </div>
          ) : (
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
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Phone Number
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
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-sage-light/10 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-charcoal">
                            {getEventDisplayName(event)}
                          </div>
                          <div className="text-sm text-sage-dark">
                            {event.customer_email}
                          </div>
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
                        <div>
                          <div className="text-sm text-charcoal">{event.venue?.name}</div>
                          <div className="text-sm text-sage-dark">{event.venue?.city}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-charcoal">
                          {event.twilio_phone_number || '—'}
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
                            : event.status === 'completed'
                            ? 'bg-sage/10 text-sage-dark'
                            : 'bg-rose/10 text-rose-dark'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/events/${event.id}`}
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
          )}
        </div>
      </div>
    </div>
  )
}
