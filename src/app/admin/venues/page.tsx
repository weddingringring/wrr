'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'
import VenueCreateModal from '@/components/VenueCreateModal'
import VenueDetailsModal from '@/components/VenueDetailsModal'
import VenueEditModal from '@/components/VenueEditModal'
import { Plus, Search, Eye } from 'lucide-react'

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

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('admin')
  
  useEffect(() => { loadVenues(); checkRole() }, [])
  useEffect(() => { filterVenues() }, [searchQuery, filterStatus, venues])
  
  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role) setUserRole(profile.role)
  }
  
  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setVenues(data || [])
    } catch (error) { console.error('Error loading venues:', error) }
    finally { setLoading(false) }
  }
  
  const filterVenues = () => {
    let filtered = [...venues]
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => filterStatus === 'active' ? v.is_active : !v.is_active)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.city?.toLowerCase().includes(query) ||
        v.primary_contact_name?.toLowerCase().includes(query) ||
        v.primary_contact_email?.toLowerCase().includes(query)
      )
    }
    setFilteredVenues(filtered)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F5F3' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: "#999" }}>Loading venues...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen" style={{ background: '#F6F5F3' }}>
      <AdminHeader currentPage="venues" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title + Action */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-serif text-3xl" style={{ color: "#111" }}>Venues</h1>
          <button
            onClick={() => setVenueModalOpen(true)}
            className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Venue
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6" style={{ border: "1px solid #E8E6E2" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Search</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, city, or contact..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Status</label>
              <div className="flex gap-2">
                {(['all', 'active', 'inactive'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className="flex-1 px-4 py-2 rounded-lg transition text-sm"
                    style={{
                      border: filterStatus === status ? 'none' : '1px solid #E8E6E2',
                      background: filterStatus === status ? '#3D5A4C' : '#fff',
                      color: filterStatus === status ? '#fff' : '#555',
                      fontWeight: filterStatus === status ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {status === 'all' ? `All (${venues.length})`
                      : status === 'active' ? `Active (${venues.filter(v => v.is_active).length})`
                      : `Inactive (${venues.filter(v => !v.is_active).length})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-4">
          <p style={{ fontSize: "0.8125rem", color: "#999" }}>Showing {filteredVenues.length} of {venues.length} venues</p>
        </div>
        
        {/* Venues Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: "1px solid #E8E6E2" }}>
          {filteredVenues.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ fontSize: "1rem", color: "#999", marginBottom: "0.5rem" }}>No venues found</p>
              <p style={{ fontSize: "0.8125rem", color: "#bbb", marginBottom: "1.5rem" }}>
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first venue'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setVenueModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                  Add Venue
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Venue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((venue, idx) => (
                    <tr key={venue.id}
                      onClick={() => { setSelectedVenueId(venue.id); setDetailsModalOpen(true) }}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(61,90,76,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                    >
                      <td className="px-6 py-3">
                        <div style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '0.9375rem' }}>{venue.name}</div>
                        <div className="text-xs" style={{ color: '#bbb' }}>
                          {venue.subscription_type === 'rental' && 'Rental Model'}
                          {venue.subscription_type === 'owned' && 'Owned Equipment'}
                          {venue.subscription_type === 'trial' && 'Trial'}
                        </div>
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: '0.8125rem', color: '#555' }}>{venue.city || '—'}</td>
                      <td className="px-6 py-3">
                        <div style={{ fontSize: '0.8125rem', color: '#333' }}>{venue.primary_contact_name || '—'}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#bbb' }}>{venue.primary_contact_email || '—'}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          background: venue.subscription_status === 'active' ? 'rgba(61,90,76,0.08)' : venue.subscription_status === 'inactive' ? '#f5f5f5' : 'rgba(180,140,60,0.08)',
                          color: venue.subscription_status === 'active' ? '#3D5A4C' : venue.subscription_status === 'inactive' ? '#999' : '#8a7020',
                        }}>
                          {(venue.subscription_status || 'Unknown').charAt(0).toUpperCase() + (venue.subscription_status || 'unknown').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500,
                          background: venue.is_active ? 'rgba(61,90,76,0.08)' : 'rgba(200,100,100,0.08)',
                          color: venue.is_active ? '#3D5A4C' : '#b05050',
                        }}>
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

      <VenueCreateModal 
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSuccess={() => { loadVenues() }}
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
          onSuccess={() => { loadVenues() }}
        />
      )}
    </div>
  )
}
