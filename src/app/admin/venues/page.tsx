'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import VenueCreateModal from '@/components/VenueCreateModal'

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
  
  useEffect(() => {
    loadVenues()
  }, [])
  
  useEffect(() => {
    filterVenues()
  }, [searchQuery, filterStatus, venues])
  
  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setVenues(data || [])
    } catch (error) {
      console.error('Error loading venues:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterVenues = () => {
    let filtered = [...venues]
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => 
        filterStatus === 'active' ? v.is_active : !v.is_active
      )
    }
    
    // Apply search filter
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
  
  const handleDeactivate = async (venueId: string) => {
    if (!confirm('Deactivate this venue? Future events will be cancelled.')) {
      return
    }
    
    try {
      // Deactivate venue
      await supabase
        .from('venues')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', venueId)
      
      // Reload venues
      loadVenues()
    } catch (error) {
      console.error('Error deactivating venue:', error)
      alert('Failed to deactivate venue')
    }
  }
  
  const handleReactivate = async (venueId: string) => {
    try {
      await supabase
        .from('venues')
        .update({ 
          is_active: true,
          deactivated_at: null
        })
        .eq('id', venueId)
      
      loadVenues()
    } catch (error) {
      console.error('Error reactivating venue:', error)
      alert('Failed to reactivate venue')
    }
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
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/admin/dashboard" className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="font-serif text-3xl text-charcoal">Venues</h1>
            </div>
            
            <button
              onClick={() => setVenueModalOpen(true)}
              className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              + Add Venue
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, city, or contact..."
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filterStatus === 'all'
                      ? 'bg-deep-green text-white'
                      : 'bg-sage-light/30 text-charcoal hover:bg-sage-light'
                  }`}
                >
                  All ({venues.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filterStatus === 'active'
                      ? 'bg-deep-green text-white'
                      : 'bg-sage-light/30 text-charcoal hover:bg-sage-light'
                  }`}
                >
                  Active ({venues.filter(v => v.is_active).length})
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filterStatus === 'inactive'
                      ? 'bg-deep-green text-white'
                      : 'bg-sage-light/30 text-charcoal hover:bg-sage-light'
                  }`}
                >
                  Inactive ({venues.filter(v => !v.is_active).length})
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-sage-dark">
            Showing {filteredVenues.length} of {venues.length} venues
          </p>
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
                  className="inline-block px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  + Add Venue
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sage-light/20 border-b border-sage-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Subscription
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
                  {filteredVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-sage-light/10 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-charcoal">{venue.name}</div>
                          <div className="text-sm text-sage-dark">
                            {venue.subscription_type === 'rental' && 'Rental Model'}
                            {venue.subscription_type === 'owned' && 'Owned Equipment'}
                            {venue.subscription_type === 'trial' && 'Trial'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal">{venue.city || '—'}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-charcoal">{venue.primary_contact_name || '—'}</div>
                          <div className="text-sm text-sage-dark">{venue.primary_contact_email || '—'}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.subscription_status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : venue.subscription_status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venue.subscription_status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.is_active
                            ? 'bg-deep-green/10 text-deep-green'
                            : 'bg-rose/10 text-rose-dark'
                        }`}>
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/venues/${venue.id}/edit`}
                            className="text-sm text-deep-green hover:text-deep-green-dark font-medium"
                          >
                            Edit
                          </Link>
                          
                          {venue.is_active ? (
                            <button
                              onClick={() => handleDeactivate(venue.id)}
                              className="text-sm text-rose hover:text-rose-dark font-medium"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(venue.id)}
                              className="text-sm text-sage hover:text-sage-dark font-medium"
                            >
                              Reactivate
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
      </div>

      {/* Venue Create Modal */}
      <VenueCreateModal 
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSuccess={() => {
          loadVenues() // Reload venues list after venue created
        }}
      />
    </div>
  )
}
