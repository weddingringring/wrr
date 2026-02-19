'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'
import { Plus, Search, Eye } from 'lucide-react'

interface Event {
  id: string
  event_type: string
  event_date: string
  partner_1_first_name: string
  partner_1_last_name: string
  partner_2_first_name: string | null
  partner_2_last_name: string | null
  customer_email: string
  customer_user_id: string
  twilio_phone_number: string | null
  status: string
  venue: { name: string; city: string; country_code?: string }
  messages_count: number
}

const countryFlag = (code?: string) =>
  code ? code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : ''

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'upcoming' | 'past'>('all')
  const [userRole, setUserRole] = useState<string>('admin')
  
  useEffect(() => { loadEvents(); checkRole() }, [])
  useEffect(() => { filterEvents() }, [searchQuery, filterStatus, filterTimeframe, events])
  
  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role) setUserRole(profile.role)
  }
  
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, venue:venues(name, city, country_code), messages:messages(count)`)
        .order('event_date', { ascending: false })
      if (error) throw error
      const eventsWithCount = (data || []).map((event: any) => ({
        ...event,
        messages_count: event.messages[0]?.count || 0
      }))
      setEvents(eventsWithCount)
    } catch (error) { console.error('Error loading events:', error) }
    finally { setLoading(false) }
  }
  
  const filterEvents = () => {
    let filtered = [...events]
    const today = new Date().toISOString().split('T')[0]
    if (filterStatus !== 'all') filtered = filtered.filter(e => e.status === filterStatus)
    if (filterTimeframe === 'upcoming') filtered = filtered.filter(e => e.event_date >= today)
    else if (filterTimeframe === 'past') filtered = filtered.filter(e => e.event_date < today)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => {
        const name1 = `${e.partner_1_first_name} ${e.partner_1_last_name}`.toLowerCase()
        const name2 = e.partner_2_first_name ? `${e.partner_2_first_name} ${e.partner_2_last_name}`.toLowerCase() : ''
        return name1.includes(query) || name2.includes(query) ||
          e.customer_email?.toLowerCase().includes(query) ||
          e.venue?.name?.toLowerCase().includes(query) ||
          e.twilio_phone_number?.includes(query)
      })
    }
    setFilteredEvents(filtered)
  }
  
  const getEventDisplayName = (event: Event) => {
    const p1 = `${event.partner_1_first_name} ${event.partner_1_last_name}`.trim()
    const p2 = event.partner_2_first_name
      ? `${event.partner_2_first_name} ${event.partner_2_last_name}`.trim()
      : null
    if (event.event_type === 'wedding') return p2 ? `${p1} & ${p2}'s Wedding` : `${p1}'s Wedding`
    return `${p1}'s ${event.event_type}`
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F5F3' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: "#999" }}>Loading events...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen" style={{ background: '#F6F5F3' }}>
      <AdminHeader currentPage="events" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-serif text-3xl" style={{ color: "#111" }}>Events</h1>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
          >
            <Plus size={16} />
            Create Event
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6" style={{ border: "1px solid #E8E6E2" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Search</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Names, venue, email, phone..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Timeframe</label>
              <select
                value={filterTimeframe}
                onChange={(e) => setFilterTimeframe(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
              >
                <option value="all">All Time</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p style={{ fontSize: "0.8125rem", color: "#999" }}>Showing {filteredEvents.length} of {events.length} events</p>
        </div>
        
        {/* Events Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: "1px solid #E8E6E2" }}>
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ fontSize: "1rem", color: "#999", marginBottom: "0.5rem" }}>No events found</p>
              <p style={{ fontSize: "0.8125rem", color: "#bbb", marginBottom: "1.5rem" }}>
                {searchQuery ? 'Try adjusting your search' : 'Create your first event to get started'}
              </p>
              {!searchQuery && (
                <Link href="/admin/events/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition">
                  <Plus size={16} />
                  Create Event
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Venue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Phone Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Messages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, idx) => (
                    <tr key={event.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(61,90,76,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                    >
                      <td className="px-6 py-3">
                        <div style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '1rem' }}>{getEventDisplayName(event)}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#bbb', marginTop: '1px' }}>{event.customer_email}</div>
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: '0.8125rem', color: '#444' }}>
                        {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3">
                        <div style={{ fontSize: '0.8125rem', color: '#333' }}>{countryFlag(event.venue?.country_code)} {event.venue?.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#bbb' }}>{event.venue?.city}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm font-mono" style={{ color: '#555' }}>{event.twilio_phone_number || '—'}</div>
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: '0.8125rem', color: event.messages_count === 0 ? '#ccc' : event.messages_count >= 10 ? '#3D5A4C' : '#333', fontWeight: event.messages_count >= 10 ? 600 : 400 }}>
                        {event.messages_count}
                      </td>
                      <td className="px-6 py-3">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          background: event.status === 'active' ? 'rgba(61,90,76,0.08)' : event.status === 'completed' ? 'rgba(140,160,140,0.1)' : 'rgba(200,100,100,0.08)',
                          color: event.status === 'active' ? '#3D5A4C' : event.status === 'completed' ? '#7a8a7a' : '#b05050',
                        }}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {userRole === 'developer' && (
                            <Link
                              href={`/customer/dashboard?viewAs=${event.customer_user_id}`}
                              className="text-sage hover:text-deep-green transition"
                              title="View as customer"
                            >
                              <Eye size={15} />
                            </Link>
                          )}
                          <Link href={`/admin/events/${event.id}`}
                            style={{ fontSize: '0.8125rem', fontWeight: 600 }}
                            className="text-deep-green hover:text-deep-green-dark font-medium">
                            View Details
                          </Link>
                        </div>
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
