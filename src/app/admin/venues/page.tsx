'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'
import VenueCreateModal from '@/components/VenueCreateModal'
import VenueDetailsModal from '@/components/VenueDetailsModal'
import VenueEditModal from '@/components/VenueEditModal'
import { Plus, Search } from 'lucide-react'

interface Venue {
  id: string
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
  
  useEffect(() => { loadVenues() }, [])
  useEffect(() => { filterVenues() }, [searchQuery, filterStatus, venues])
  
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading venues...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader currentPage="venues" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title + Action */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif text-3xl text-charcoal">Venues</h1>
          <button
            onClick={() => setVenueModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Venue
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Search</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, city, or contact..."
                  className="w-full pl-9 pr-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
              <div className="flex gap-2">
                {(['all', 'active', 'inactive'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 px-4 py-2 rounded-lg transition ${
                      filterStatus === status
                        ? 'bg-deep-green text-white'
                        : 'bg-sage-light/30 text-charcoal hover:bg-sage-light'
                    }`}
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
          <p className="text-sm text-sage-dark">Showing {filteredVenues.length} of {venues.length} venues</p>
        </div>
        
        {/* Venues Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredVenues.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-sage-dark mb-2">No venues found</p>
              <p className="text-sm text-sage-dark mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first venue'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setVenueModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                  Add Venue
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sage-light/20 border-b border-sage-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Venue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sage-dark uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-sage-dark uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-light">
                  {filteredVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-sage-light/10 transition">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedVenueId(venue.id); setDetailsModalOpen(true) }}
                          className="font-medium text-charcoal hover:text-deep-green transition cursor-pointer text-left"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          {venue.name}
                        </button>
                        <div className="text-sm text-sage-dark">
                          {venue.subscription_type === 'rental' && 'Rental Model'}
                          {venue.subscription_type === 'owned' && 'Owned Equipment'}
                          {venue.subscription_type === 'trial' && 'Trial'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">{venue.city || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal">{venue.primary_contact_name || '—'}</div>
                        <div className="text-sm text-sage-dark">{venue.primary_contact_email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.subscription_status === 'active' ? 'bg-green-100 text-green-800'
                            : venue.subscription_status === 'inactive' ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>{venue.subscription_status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.is_active ? 'bg-deep-green/10 text-deep-green' : 'bg-rose/10 text-rose-dark'
                        }`}>{venue.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedVenueId(venue.id); setEditModalOpen(true) }}
                          className="text-sm text-deep-green hover:text-deep-green-dark font-medium cursor-pointer"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          Edit
                        </button>
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
