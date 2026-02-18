'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'
import VenueCreateModal from '@/components/VenueCreateModal'
import VenueDetailsModal from '@/components/VenueDetailsModal'
import VenueEditModal from '@/components/VenueEditModal'
import { Building2, Calendar, Mic, Phone, Plus, Search, ChevronRight, Eye } from 'lucide-react'

interface DashboardStats {
  totalVenues: number
  activeVenues: number
  totalEvents: number
  upcomingEvents: number
  totalMessages: number
  totalPhones: number
}

interface Venue {
  id: string
  owner_id: string
  name: string
  city: string
  primary_contact_name: string
  primary_contact_email: string
  subscription_type: string
  subscription_status: string
  is_active: boolean
  created_at: string
}

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
  venue: { name: string; city: string }
  messages_count: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('admin')
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)

  // Venues state
  const [venues, setVenues] = useState<Venue[]>([])
  const [venueSearch, setVenueSearch] = useState('')
  const [venueFilter, setVenueFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [eventSearch, setEventSearch] = useState('')
  const [eventTimeframe, setEventTimeframe] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    checkAuth()
    loadStats()
    loadVenues()
    loadEvents()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin' && profile?.role !== 'developer') {
      await supabase.auth.signOut()
      router.push('/')
      return
    }
    setUserRole(profile.role)
    setUser({ ...profile, full_name: `${profile.first_name} ${profile.last_name}` })
  }

  const loadStats = async () => {
    try {
      const [venuesRes, activeVenuesRes, eventsRes, upcomingEventsRes, messagesRes, phonesRes] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('phones').select('id', { count: 'exact', head: true })
      ])
      setStats({
        totalVenues: venuesRes.count || 0,
        activeVenues: activeVenuesRes.count || 0,
        totalEvents: eventsRes.count || 0,
        upcomingEvents: upcomingEventsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalPhones: phonesRes.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setVenues(data || [])
    } catch (error) { console.error('Error loading venues:', error) }
  }

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, venue:venues(name, city), messages:messages(count)`)
        .order('event_date', { ascending: false })
      if (error) throw error
      setEvents((data || []).map((e: any) => ({ ...e, messages_count: e.messages[0]?.count || 0 })))
    } catch (error) { console.error('Error loading events:', error) }
  }

  // Venue filtering
  const filteredVenues = venues.filter(v => {
    if (venueFilter === 'active' && !v.is_active) return false
    if (venueFilter === 'inactive' && v.is_active) return false
    if (venueSearch) {
      const q = venueSearch.toLowerCase()
      return v.name.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.primary_contact_name?.toLowerCase().includes(q) ||
        v.primary_contact_email?.toLowerCase().includes(q)
    }
    return true
  })

  // Event filtering
  const filteredEvents = events.filter(e => {
    const today = new Date().toISOString().split('T')[0]
    if (eventTimeframe === 'upcoming' && e.event_date < today) return false
    if (eventTimeframe === 'past' && e.event_date >= today) return false
    if (eventSearch) {
      const q = eventSearch.toLowerCase()
      const name1 = `${e.partner_1_first_name} ${e.partner_1_last_name}`.toLowerCase()
      const name2 = e.partner_2_first_name ? `${e.partner_2_first_name} ${e.partner_2_last_name}`.toLowerCase() : ''
      return name1.includes(q) || name2.includes(q) ||
        e.customer_email?.toLowerCase().includes(q) ||
        e.venue?.name?.toLowerCase().includes(q) ||
        e.twilio_phone_number?.includes(q)
    }
    return true
  })

  const getEventDisplayName = (event: Event) => {
    const p1 = `${event.partner_1_first_name} ${event.partner_1_last_name}`.trim()
    const p2 = event.partner_2_first_name
      ? `${event.partner_2_first_name} ${event.partner_2_last_name}`.trim()
      : null
    if (event.event_type === 'wedding') {
      return p2 ? `${p1} & ${p2}` : p1
    }
    return `${p1}'s ${event.event_type}`
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
      <AdminHeader currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-charcoal">Admin Dashboard</h1>
          <p className="text-sm text-sage-dark mt-1">Welcome back, {user?.full_name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Venues" value={stats?.totalVenues || 0} subtitle={`${stats?.activeVenues || 0} active`} icon={Building2} color="deep-green" />
          <StatCard title="Total Events" value={stats?.totalEvents || 0} subtitle={`${stats?.upcomingEvents || 0} upcoming`} icon={Calendar} color="sage" />
          <StatCard title="Messages Recorded" value={stats?.totalMessages || 0} subtitle="All time" icon={Mic} color="rose" />
          <StatCard title="Phone Inventory" value={stats?.totalPhones || 0} subtitle="Total devices" icon={Phone} color="gold" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setVenueModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition text-sm"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Venue
          </button>
          <Link
            href="/admin/phones"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition text-sm border border-sage-light"
          >
            <Phone size={16} />
            Phone Inventory
          </Link>
          <Link
            href="/admin/error-logs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition text-sm border border-sage-light"
          >
            Error Logs
          </Link>
        </div>

        {/* Venues Table */}
        <div className="bg-white rounded-xl shadow-sm mb-10 overflow-hidden">
          <div className="px-6 py-5 border-b border-sage-light/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-serif text-xl text-charcoal flex items-center gap-2">
                <Building2 size={20} className="text-deep-green" />
                Venues
                <span className="text-sm font-sans text-sage-dark font-normal ml-1">({filteredVenues.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues..."
                    className="pl-9 pr-4 py-2 text-sm border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent w-48"
                  />
                </div>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          {filteredVenues.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sage-dark text-sm">{venueSearch ? 'No venues match your search' : 'No venues yet'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-light/10 border-b border-sage-light/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-sage-dark uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-light/40">
                    {filteredVenues.slice(0, 10).map(venue => (
                      <tr key={venue.id} className="hover:bg-sage-light/10 transition">
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => { setSelectedVenueId(venue.id); setDetailsModalOpen(true) }}
                            className="font-medium text-charcoal hover:text-deep-green transition cursor-pointer text-left text-sm"
                            style={{ background: 'none', border: 'none', padding: 0 }}
                          >
                            {venue.name}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-sage-dark">{venue.city || '—'}</td>
                        <td className="px-6 py-3.5">
                          <div className="text-sm text-charcoal">{venue.primary_contact_name || '—'}</div>
                          <div className="text-xs text-sage-dark">{venue.primary_contact_email || '—'}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            venue.is_active ? 'bg-deep-green/10 text-deep-green' : 'bg-rose/10 text-rose-dark'
                          }`}>
                            {venue.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {userRole === 'developer' && (
                              <Link
                                href={`/venue/dashboard?viewAs=${venue.owner_id}`}
                                className="text-sage hover:text-deep-green transition"
                                title="View as venue"
                              >
                                <Eye size={16} />
                              </Link>
                            )}
                            <button
                              onClick={() => { setSelectedVenueId(venue.id); setEditModalOpen(true) }}
                              className="text-sm text-deep-green hover:text-deep-green-dark font-medium cursor-pointer"
                              style={{ background: 'none', border: 'none', padding: 0 }}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-sage-light/50 text-center">
                <Link href="/admin/venues" className="text-sm text-deep-green hover:text-deep-green-dark font-medium inline-flex items-center gap-1">
                  View all venues <ChevronRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-sage-light/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-serif text-xl text-charcoal flex items-center gap-2">
                <Calendar size={20} className="text-deep-green" />
                Events
                <span className="text-sm font-sans text-sage-dark font-normal ml-1">({filteredEvents.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search events..."
                    className="pl-9 pr-4 py-2 text-sm border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent w-48"
                  />
                </div>
                <select
                  value={eventTimeframe}
                  onChange={(e) => setEventTimeframe(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </div>
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sage-dark text-sm">{eventSearch ? 'No events match your search' : 'No events yet'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-light/10 border-b border-sage-light/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Messages</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Status</th>
                      {userRole === 'developer' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-sage-dark uppercase tracking-wider">View</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-light/40">
                    {filteredEvents.slice(0, 10).map(event => (
                      <tr key={event.id} className="hover:bg-sage-light/10 transition">
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-charcoal text-sm">{getEventDisplayName(event)}</div>
                          <div className="text-xs text-sage-dark">{event.customer_email}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-charcoal">
                          {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="text-sm text-charcoal">{event.venue?.name}</div>
                          <div className="text-xs text-sage-dark">{event.venue?.city}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-charcoal">{event.messages_count}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === 'active' ? 'bg-deep-green/10 text-deep-green'
                              : event.status === 'completed' ? 'bg-sage/10 text-sage-dark'
                              : 'bg-rose/10 text-rose-dark'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        {userRole === 'developer' && (
                          <td className="px-6 py-3.5 text-right">
                            <Link
                              href={`/customer/dashboard?viewAs=${event.customer_user_id}`}
                              className="text-sage hover:text-deep-green transition"
                              title="View as customer"
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-sage-light/50 text-center">
                <Link href="/admin/events" className="text-sm text-deep-green hover:text-deep-green-dark font-medium inline-flex items-center gap-1">
                  View all {events.length} events <ChevronRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <VenueCreateModal 
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSuccess={() => { loadStats(); loadVenues() }}
      />
      {selectedVenueId && (
        <VenueDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => { setDetailsModalOpen(false); setSelectedVenueId(null) }}
          venueId={selectedVenueId}
        />
      )}
      {selectedVenueId && (
        <VenueEditModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedVenueId(null) }}
          venueId={selectedVenueId}
          onSuccess={() => { loadVenues(); loadStats() }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: number
  subtitle: string
  icon: any
  color: string
}) {
  const iconBg: Record<string, string> = {
    'deep-green': 'bg-deep-green/10 text-deep-green',
    'sage': 'bg-sage/10 text-sage-dark',
    'rose': 'bg-rose/10 text-rose-dark',
    'gold': 'bg-gold/10 text-gold-dark',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-sage-dark mb-1">{title}</p>
          <p className="text-3xl font-bold text-charcoal mb-1">{value.toLocaleString()}</p>
          <p className="text-xs text-sage-dark">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg[color] || ''}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
