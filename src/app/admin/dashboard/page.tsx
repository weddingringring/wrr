'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'
import VenueCreateModal from '@/components/VenueCreateModal'
import VenueDetailsModal from '@/components/VenueDetailsModal'
import VenueEditModal from '@/components/VenueEditModal'
import AdminEventDetailsModal from '@/components/AdminEventDetailsModal'
import EventCreateModal from '@/components/EventCreateModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { Building2, Calendar, Mic, Phone, Plus, Search, ChevronRight, Eye, AlertTriangle, ShieldCheck, UserPlus, Shield, Trash2 } from 'lucide-react'

interface DashboardStats {
  totalVenues: number
  activeVenues: number
  totalEvents: number
  upcomingEvents: number
  totalMessages: number
  totalPhones: number
  criticalErrors: number
  warningErrors: number
  errorErrors: number
}

interface Venue {
  id: string
  owner_id: string
  name: string
  city: string
  country_code: string
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
  venue: { name: string; city: string; country_code?: string }
  messages_count: number
}

const countryFlag = (code?: string) =>
  code ? code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : ''

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
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventCreateModalOpen, setEventCreateModalOpen] = useState(false)

  // Admin users state (dev only)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminUserModalOpen, setAdminUserModalOpen] = useState(false)

  // Delete modal state (dev only)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'event' | 'venue'; id: string; name: string } | null>(null)

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
    loadAdminUsers()
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
      const [venuesRes, activeVenuesRes, eventsRes, upcomingEventsRes, messagesRes, phonesRes, criticalRes, warningRes, errorRes] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('phones').select('id', { count: 'exact', head: true }),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('severity', 'critical').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('severity', 'warning').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('severity', 'error').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ])
      setStats({
        totalVenues: venuesRes.count || 0,
        activeVenues: activeVenuesRes.count || 0,
        totalEvents: eventsRes.count || 0,
        upcomingEvents: upcomingEventsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalPhones: phonesRes.count || 0,
        criticalErrors: criticalRes.count || 0,
        warningErrors: warningRes.count || 0,
        errorErrors: errorRes.count || 0,
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
        .select(`*, venue:venues(name, city, country_code), messages:messages(count)`)
        .order('event_date', { ascending: false })
      if (error) throw error
      setEvents((data || []).map((e: any) => ({ ...e, messages_count: e.messages[0]?.count || 0 })))
    } catch (error) { console.error('Error loading events:', error) }
  }

  const loadAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, is_active, created_at, last_login_at')
        .in('role', ['admin', 'developer'])
        .order('created_at', { ascending: true })
      if (error) throw error
      setAdminUsers(data || [])
    } catch (error) { console.error('Error loading admin users:', error) }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F5F3' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#999' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F6F5F3' }}>
      <AdminHeader currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl" style={{ color: '#111' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Welcome back, {user?.full_name}</p>
        </div>

        {/* ═══ SYSTEM METRICS ZONE ═══ */}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <StatCard title="Total Venues" value={stats?.totalVenues || 0} subtitle={`${stats?.activeVenues || 0} active`} icon={Building2} color="deep-green" />
          <StatCard title="Total Events" value={stats?.totalEvents || 0} subtitle={`${stats?.upcomingEvents || 0} upcoming`} icon={Calendar} color="sage" />
          <StatCard title="Messages Recorded" value={stats?.totalMessages || 0} subtitle="All time" icon={Mic} color="rose" />
          <StatCard title="Phone Inventory" value={stats?.totalPhones || 0} subtitle="Total devices" icon={Phone} color="gold" />
        </div>

        {/* System Status Card */}
        <div className="rounded-lg shadow-sm p-5 mb-5" style={{ background: '#EEEDEB', border: '1px solid #E8E6E2' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: '#666' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#222' }}>System Status</span>
                <span style={{ fontSize: '0.6875rem', color: '#999', fontWeight: 400 }}>Last 24h</span>
              </div>
              <div style={{ width: '1px', height: '1.25rem', background: '#ddd' }} />
              <div className="flex items-center gap-4">
                <StatusIndicator label="Critical" count={stats?.criticalErrors || 0} color="red" />
                <StatusIndicator label="Errors" count={stats?.errorErrors || 0} color="amber" />
                <StatusIndicator label="Warnings" count={stats?.warningErrors || 0} color="yellow" />
                <StatusIndicator
                  label="Operational"
                  count={(stats?.criticalErrors || 0) === 0 && (stats?.errorErrors || 0) === 0 ? 1 : 0}
                  color="green"
                  isBoolean
                />
              </div>
            </div>
            <Link href="/admin/error-logs" style={{ fontSize: '0.75rem', color: '#888', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View logs <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-12">
          <button
            onClick={() => setVenueModalOpen(true)}
            className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ border: 'none', cursor: 'pointer', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            Add Venue
          </button>
          <button
            onClick={() => setEventCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg font-medium transition"
            style={{ border: '1px solid #3D5A4C', cursor: 'pointer', padding: '0.625rem 1.25rem', fontSize: '0.875rem', background: '#fff', color: '#3D5A4C' }}
          >
            <Calendar size={14} />
            Create Event
          </button>
          <Link
            href="/admin/phones"
            className="inline-flex items-center gap-1.5 rounded-lg font-medium transition text-sm"
            style={{ padding: '0.625rem 1rem', color: '#555', border: '1px solid #E8E6E2', background: '#fff' }}
          >
            <Phone size={14} style={{ opacity: 0.6 }} />
            Phone Inventory
          </Link>
        </div>

        {/* ═══ OPERATIONAL DATA ZONE ═══ */}

        {/* Venues Table */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden" style={{ border: "1px solid #E8E6E2" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E8E6E2' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-serif text-lg flex items-center gap-2" style={{ color: '#111', fontWeight: 600 }}>
                <Building2 size={18} className="text-deep-green" />
                Venues
                <span className="font-sans font-normal ml-1" style={{ fontSize: '0.8125rem', color: '#aaa' }}>({filteredVenues.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#bbb' }} />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues..."
                    className="pl-8 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent w-44"
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </div>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  style={{ borderColor: '#e0e0e0' }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Link href="/admin/venues" style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
          {filteredVenues.length === 0 ? (
            <div className="p-8 text-center">
              <p style={{ color: '#999' }} className="text-sm">{venueSearch ? 'No venues match your search' : 'No venues yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Venue</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Location</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Contact</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Status</th>
                    <th className="px-5 py-2 text-right uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.slice(0, 10).map((venue, idx) => (
                    <tr
                      key={venue.id}
                      onClick={() => { setSelectedVenueId(venue.id); setDetailsModalOpen(true) }}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(61,90,76,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                    >
                      <td className="px-5 py-2">
                        <span style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '0.9375rem' }}>{venue.name}</span>
                      </td>
                      <td className="px-5 py-2" style={{ fontSize: '0.8125rem', color: '#666' }}>
                        {countryFlag(venue.country_code)} {venue.city || '—'}
                      </td>
                      <td className="px-5 py-2">
                        <div style={{ fontSize: '0.8125rem', color: '#333' }}>{venue.primary_contact_name || '—'}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#c0c0c0', marginTop: '1px' }}>{venue.primary_contact_email || '—'}</div>
                      </td>
                      <td className="px-5 py-2">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          background: venue.is_active ? 'rgba(61,90,76,0.08)' : 'rgba(200,100,100,0.08)',
                          color: venue.is_active ? '#3D5A4C' : '#b05050',
                        }}>
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {userRole === 'developer' && (
                            <Link
                              href={`/venue/dashboard?viewAs=${venue.owner_id}`}
                              className="text-sage hover:text-deep-green transition"
                              title="View as venue"
                            >
                              <Eye size={15} />
                            </Link>
                          )}
                          <button
                            onClick={() => { setSelectedVenueId(venue.id); setEditModalOpen(true) }}
                            className="text-deep-green hover:text-deep-green-dark font-medium cursor-pointer"
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8125rem', fontWeight: 600 }}
                          >
                            Edit
                          </button>
                          {userRole === 'developer' && (
                            <button
                              onClick={() => { setDeleteTarget({ type: 'venue', id: venue.id, name: venue.name }); setDeleteModalOpen(true) }}
                              title="Permanently delete"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ccc', display: 'flex' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a33' }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#ccc' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: "1px solid #E8E6E2" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E8E6E2' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-serif text-lg flex items-center gap-2" style={{ color: '#111', fontWeight: 600 }}>
                <Calendar size={18} className="text-deep-green" />
                Events
                <span className="font-sans font-normal ml-1" style={{ fontSize: '0.8125rem', color: '#aaa' }}>({filteredEvents.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#bbb' }} />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search events..."
                    className="pl-8 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent w-44"
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </div>
                <select
                  value={eventTimeframe}
                  onChange={(e) => setEventTimeframe(e.target.value as any)}
                  className="px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  style={{ borderColor: '#e0e0e0' }}
                >
                  <option value="all">All Time</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
                <Link href="/admin/events" style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p style={{ color: '#999' }} className="text-sm">{eventSearch ? 'No events match your search' : 'No events yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Event</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Date</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Venue</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Messages</th>
                    <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Status</th>
                    {userRole === 'developer' && (
                      <th className="px-5 py-2 text-right uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>View</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 10).map((event, idx) => (
                    <tr
                      key={event.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff', cursor: 'pointer' }}
                      onClick={() => { setSelectedEventId(event.id); setEventDetailsModalOpen(true) }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(61,90,76,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                    >
                      <td className="px-5 py-2">
                        <div style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '1rem' }}>{getEventDisplayName(event)}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#bbb', marginTop: '1px' }}>{event.customer_email}</div>
                      </td>
                      <td className="px-5 py-2" style={{ fontSize: '0.8125rem', color: '#444' }}>
                        {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-2">
                        <div style={{ fontSize: '0.8125rem', color: '#333' }}>{countryFlag(event.venue?.country_code)} {event.venue?.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#c0c0c0', marginTop: '1px' }}>{event.venue?.city}</div>
                      </td>
                      <td className="px-5 py-2" style={{ fontSize: '0.8125rem', color: event.messages_count === 0 ? '#ccc' : event.messages_count >= 10 ? '#3D5A4C' : '#333', fontWeight: event.messages_count >= 10 ? 600 : 400 }}>
                        {event.messages_count}
                      </td>
                      <td className="px-5 py-2">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          background: event.status === 'active' ? 'rgba(61,90,76,0.08)' : event.status === 'completed' ? 'rgba(140,160,140,0.1)' : 'rgba(200,100,100,0.08)',
                          color: event.status === 'active' ? '#3D5A4C' : event.status === 'completed' ? '#7a8a7a' : '#b05050',
                        }}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      {userRole === 'developer' && (
                        <td className="px-5 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/customer/dashboard?viewAs=${event.customer_user_id}`}
                              className="text-sage hover:text-deep-green transition"
                              title="View as customer"
                            >
                              <Eye size={15} />
                            </Link>
                            <button
                              onClick={() => { setDeleteTarget({ type: 'event', id: event.id, name: getEventDisplayName(event) }); setDeleteModalOpen(true) }}
                              title="Permanently delete"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ccc', display: 'flex' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a33' }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#ccc' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Admin Users Table — Developer Only */}
        {userRole === 'developer' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-8" style={{ border: "1px solid #E8E6E2" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E8E6E2' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg flex items-center gap-2" style={{ color: '#111', fontWeight: 600 }}>
                  <Shield size={18} className="text-deep-green" />
                  Admin Users
                  <span className="font-sans font-normal ml-1" style={{ fontSize: '0.8125rem', color: '#aaa' }}>({adminUsers.length})</span>
                </h2>
                <button
                  onClick={() => setAdminUserModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg font-medium transition text-sm"
                  style={{ padding: '0.5rem 0.875rem', color: '#3D5A4C', border: '1px solid #3D5A4C', background: '#fff', cursor: 'pointer' }}
                >
                  <UserPlus size={14} /> Create User
                </button>
              </div>
            </div>
            {adminUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p style={{ color: '#999' }} className="text-sm">No admin users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                      <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Name</th>
                      <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Email</th>
                      <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Role</th>
                      <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Last Login</th>
                      <th className="px-5 py-2 text-left uppercase tracking-wider" style={{ color: '#777', fontSize: '0.6875rem', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((au, idx) => (
                      <tr key={au.id} style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff' }}>
                        <td className="px-5 py-2" style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '0.9375rem' }}>
                          {au.first_name} {au.last_name}
                        </td>
                        <td className="px-5 py-2" style={{ fontSize: '0.8125rem', color: '#555' }}>{au.email}</td>
                        <td className="px-5 py-2">
                          <span style={{
                            display: 'inline-flex', padding: '2px 10px', borderRadius: '999px',
                            fontSize: '0.6875rem', fontWeight: 500,
                            background: au.role === 'developer' ? 'rgba(80,100,180,0.08)' : 'rgba(61,90,76,0.08)',
                            color: au.role === 'developer' ? '#4a5a8a' : '#3D5A4C',
                          }}>{au.role.charAt(0).toUpperCase() + au.role.slice(1)}</span>
                        </td>
                        <td className="px-5 py-2" style={{ fontSize: '0.8125rem', color: '#888' }}>
                          {au.last_login_at ? new Date(au.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
                        </td>
                        <td className="px-5 py-2">
                          <span style={{
                            display: 'inline-flex', padding: '2px 10px', borderRadius: '999px',
                            fontSize: '0.6875rem', fontWeight: 500,
                            background: au.is_active ? 'rgba(61,90,76,0.08)' : 'rgba(200,100,100,0.08)',
                            color: au.is_active ? '#3D5A4C' : '#b05050',
                          }}>{au.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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

      <AdminEventDetailsModal
        isOpen={eventDetailsModalOpen}
        onClose={() => { setEventDetailsModalOpen(false); setSelectedEventId(null) }}
        eventId={selectedEventId}
        userRole={userRole}
        onSuccess={() => { loadEvents(); loadStats() }}
      />

      <EventCreateModal
        isOpen={eventCreateModalOpen}
        onClose={() => setEventCreateModalOpen(false)}
        onSuccess={() => { loadEvents(); loadStats() }}
        venues={venues.filter(v => v.is_active).map(v => ({ id: v.id, name: v.name }))}
      />

      {adminUserModalOpen && (
        <CreateAdminUserModal
          onClose={() => setAdminUserModalOpen(false)}
          onSuccess={() => { setAdminUserModalOpen(false); loadAdminUsers() }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setDeleteTarget(null) }}
          onSuccess={() => { setDeleteModalOpen(false); setDeleteTarget(null); loadStats(); loadVenues(); loadEvents() }}
          type={deleteTarget.type}
          targetId={deleteTarget.id}
          targetName={deleteTarget.name}
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
    'deep-green': 'bg-deep-green/8',
    'sage': 'bg-sage/8',
    'rose': 'bg-rose/8',
    'gold': 'bg-gold/8',
  }
  const iconColor: Record<string, React.CSSProperties> = {
    'deep-green': { color: '#3D5A4C', opacity: 0.5 },
    'sage': { color: '#7a8a7a', opacity: 0.5 },
    'rose': { color: '#b05050', opacity: 0.45 },
    'gold': { color: '#a08030', opacity: 0.45 },
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5" style={{ border: '1px solid #E8E6E2' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#777', fontWeight: 500 }}>{title}</p>
          <p className="font-bold mb-0.5" style={{ fontSize: '2.5rem', lineHeight: 1, color: '#111' }}>{value.toLocaleString()}</p>
          <p className="text-xs" style={{ color: '#999' }}>{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg[color] || ''}`}>
          <Icon size={20} style={iconColor[color] || {}} />
        </div>
      </div>
    </div>
  )
}

// Status Indicator for RAG system
function StatusIndicator({ label, count, color, isBoolean = false }: {
  label: string
  count: number
  color: 'red' | 'amber' | 'yellow' | 'green'
  isBoolean?: boolean
}) {
  const dotColors: Record<string, string> = {
    red: count > 0 ? '#c44' : '#dbb',
    amber: count > 0 ? '#c87830' : '#d4c4a8',
    yellow: count > 0 ? '#b8a030' : '#d4cca8',
    green: isBoolean && count > 0 ? '#4a8a5a' : isBoolean ? '#bbb' : count > 0 ? '#4a8a5a' : '#bcc8bc',
  }
  const textColors: Record<string, string> = {
    red: count > 0 ? '#a33' : '#cbb',
    amber: count > 0 ? '#9a6020' : '#bbb',
    yellow: count > 0 ? '#8a7020' : '#bbb',
    green: isBoolean && count > 0 ? '#3D5A4C' : '#bbb',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColors[color], display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: textColors[color], fontWeight: 500 }}>
        {isBoolean ? (count > 0 ? label : 'Issues') : <><span style={{ fontWeight: 600 }}>{count}</span> {label}</>}
      </span>
    </div>
  )
}

// Create Admin User Modal
function CreateAdminUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ email: string; tempPassword: string } | null>(null)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'admin' })
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/admin/create-admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create user')
      setSuccess({ email: formData.email, tempPassword: result.tempPassword })
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (success) {
      navigator.clipboard.writeText(`Email: ${success.email}\nTemporary Password: ${success.tempPassword}\n\nLogin at: ${window.location.origin}/admin/login`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" style={{ border: '1px solid #E8E6E2' }}>
        <div className="p-6" style={{ borderBottom: '1px solid #E8E6E2' }}>
          <h2 className="font-serif text-xl" style={{ color: '#111' }}>Create Admin User</h2>
          <p style={{ fontSize: '0.8125rem', color: '#888', marginTop: '0.25rem' }}>User will need to change password on first login</p>
        </div>

        {success ? (
          <div className="p-6">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: 'rgba(61,90,76,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <UserPlus size={20} style={{ color: '#3D5A4C' }} />
              </div>
              <p style={{ fontWeight: 600, color: '#111', marginBottom: '0.25rem' }}>User Created Successfully</p>
              <p style={{ fontSize: '0.8125rem', color: '#888' }}>Share these credentials securely</p>
            </div>
            <div style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase' as any, letterSpacing: '0.05em' }}>Email</p>
                <p style={{ fontSize: '0.875rem', color: '#111', fontFamily: 'monospace' }}>{success.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#999', textTransform: 'uppercase' as any, letterSpacing: '0.05em' }}>Temporary Password</p>
                <p style={{ fontSize: '0.875rem', color: '#111', fontFamily: 'monospace' }}>{success.tempPassword}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={copyCredentials}
                style={{ flex: 1, padding: '0.625rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: copied ? '#3D5A4C' : '#555' }}>
                {copied ? '✓ Copied!' : 'Copy Credentials'}
              </button>
              <button onClick={onSuccess}
                style={{ flex: 1, padding: '0.625rem', border: 'none', borderRadius: '0.375rem', background: '#3D5A4C', color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem', color: '#a33', fontSize: '0.8125rem' }}>{error}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#555', display: 'block', marginBottom: '0.375rem' }}>First Name</label>
                <input type="text" required value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: '1px solid #E8E6E2' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#555', display: 'block', marginBottom: '0.375rem' }}>Last Name</label>
                <input type="text" required value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: '1px solid #E8E6E2' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#555', display: 'block', marginBottom: '0.375rem' }}>Email</label>
              <input type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: '1px solid #E8E6E2' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#555', display: 'block', marginBottom: '0.375rem' }}>Role</label>
              <select value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: '1px solid #E8E6E2' }}>
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '0.625rem', border: '1px solid #E8E6E2', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#555' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 1, padding: '0.625rem', border: 'none', borderRadius: '0.375rem', background: '#3D5A4C', color: 'white', cursor: loading ? 'wait' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
