'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import { Plus, Search } from 'lucide-react'

interface Phone {
  id: string
  serial_number: string
  imei: string
  sim_number: string
  sim_provider: string
  color: string
  model: string
  status: string
  venue_id: string | null
  venue: { name: string } | null
  created_at: string
}

export default function AdminPhonesPage() {
  const [phones, setPhones] = useState<Phone[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => { loadPhones() }, [])

  const loadPhones = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select(`*, venue:venues(name)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPhones(data || [])
    } catch (error) { console.error('Error loading phones:', error) }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditingPhone(null); setModalOpen(true) }
  const openEdit = (phone: Phone) => { setEditingPhone(phone); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingPhone(null) }

  const filteredPhones = phones.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.serial_number?.toLowerCase().includes(q) ||
        p.imei?.toLowerCase().includes(q) ||
        p.sim_number?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q) ||
        p.venue?.name?.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F5F3' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: "#999" }}>Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F6F5F3' }}>
      <AdminHeader currentPage="phones" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title + Action */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-serif text-3xl" style={{ color: "#111" }}>Phone Inventory</h1>
            <p style={{ fontSize: "0.8125rem", color: "#888", marginTop: "0.25rem" }}>Manage physical phone devices</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} />
            Add Phone
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ border: '1px solid #E8E6E2' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#777', fontWeight: 500 }}>Total Phones</p>
            <p className="font-bold" style={{ fontSize: '1.75rem', color: '#111' }}>{phones.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ border: '1px solid #E8E6E2' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#777', fontWeight: 500 }}>Available</p>
            <p className="font-bold text-deep-green" style={{ fontSize: '1.75rem' }}>{phones.filter(p => p.status === 'available').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ border: '1px solid #E8E6E2' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#777', fontWeight: 500 }}>In Use</p>
            <p className="font-bold" style={{ fontSize: '1.75rem', color: '#555' }}>{phones.filter(p => p.status === 'in_use').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ border: '1px solid #E8E6E2' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#777', fontWeight: 500 }}>Maintenance</p>
            <p className="font-bold" style={{ fontSize: '1.75rem', color: '#b05050' }}>{phones.filter(p => p.status === 'maintenance').length}</p>
          </div>
        </div>

        {/* Search + Filter */}
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
                  placeholder="Search by serial, IMEI, SIM, venue..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent" style={{ border: "1px solid #E8E6E2" }}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Phones Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: "1px solid #E8E6E2" }}>
          {filteredPhones.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ fontSize: "1rem", color: "#999", marginBottom: "0.5rem" }}>No phones in inventory</p>
              <p style={{ fontSize: "0.8125rem", color: "#bbb", marginBottom: "1.5rem" }}>Add your first phone to start tracking inventory</p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', border: 'none', cursor: 'pointer' }}
              >
                <Plus size={16} />
                Add Phone
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F6F5F3', borderBottom: '1px solid #E8E6E2' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Serial / IMEI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>SIM Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#777' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhones.map((phone, idx) => (
                    <tr key={phone.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #E8E6E2', background: idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(61,90,76,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? '#FAFAF9' : '#fff' }}
                    >
                      <td className="px-6 py-3">
                        <div style={{ fontWeight: 600, color: '#0d0d0d', fontSize: '0.9375rem' }}>{phone.color} {phone.model}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#333' }}>{phone.serial_number}</div>
                        <div className="font-mono" style={{ fontSize: '0.6875rem', color: '#bbb' }}>{phone.imei}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-mono" style={{ fontSize: '0.8125rem', color: '#333' }}>{phone.sim_number}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#888' }}>{phone.sim_provider}</div>
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: '0.8125rem', color: '#555' }}>{phone.venue?.name || '\u2014'}</td>
                      <td className="px-6 py-3">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500, textTransform: 'capitalize' as const,
                          background: phone.status === 'available' ? 'rgba(61,90,76,0.08)' : phone.status === 'in_use' ? 'rgba(140,160,140,0.1)' : 'rgba(200,100,100,0.08)',
                          color: phone.status === 'available' ? '#3D5A4C' : phone.status === 'in_use' ? '#7a8a7a' : '#b05050',
                        }}>
                          {phone.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => openEdit(phone)}
                          className="text-deep-green hover:text-deep-green-dark cursor-pointer"
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8125rem', fontWeight: 600 }}>
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

      {modalOpen && (
        <PhoneModal
          phone={editingPhone}
          onClose={closeModal}
          onSuccess={() => { closeModal(); loadPhones() }}
        />
      )}
    </div>
  )
}

/* === Unified Add/Edit Phone Modal === */
function PhoneModal({ phone, onClose, onSuccess }: { phone: Phone | null, onClose: () => void, onSuccess: () => void }) {
  const isEdit = !!phone
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    serialNumber: phone?.serial_number || '',
    imei: phone?.imei || '',
    simNumber: phone?.sim_number || '',
    simProvider: phone?.sim_provider || 'EE',
    color: phone?.color || 'Pink',
    model: phone?.model || 'Opis 60s Mobile',
    status: phone?.status || 'available',
    venueId: phone?.venue_id || ''
  })

  useEffect(() => {
    supabase.from('venues').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setVenues(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        serial_number: formData.serialNumber,
        imei: formData.imei,
        sim_number: formData.simNumber,
        sim_provider: formData.simProvider,
        color: formData.color,
        model: formData.model,
        status: formData.status,
        venue_id: formData.venueId || null
      }

      if (isEdit) {
        const { error: updateErr } = await supabase.from('phones').update(payload).eq('id', phone!.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from('phones').insert(payload)
        if (insertErr) throw insertErr
      }
      onSuccess()
    } catch (err: any) {
      console.error('Phone save error:', err)
      setError(err.message || 'Failed to save phone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6" style={{ borderBottom: '1px solid #E8E6E2' }}>
          <h2 className="font-serif text-2xl" style={{ color: '#111' }}>{isEdit ? 'Edit Phone' : 'Add New Phone'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(180,60,60,0.06)', border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem', color: '#a33', fontSize: '0.8125rem' }}>{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Serial Number *</label>
              <input type="text" required value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }} placeholder="OPIS001" />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>IMEI *</label>
              <input type="text" required value={formData.imei}
                onChange={(e) => setFormData({...formData, imei: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }} placeholder="123456789012345" />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>SIM Number *</label>
              <input type="tel" required value={formData.simNumber}
                onChange={(e) => setFormData({...formData, simNumber: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }} placeholder="+447700900000" />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>SIM Provider *</label>
              <select required value={formData.simProvider}
                onChange={(e) => setFormData({...formData, simProvider: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }}>
                <option value="EE">EE</option><option value="Vodafone">Vodafone</option>
                <option value="O2">O2</option><option value="Three">Three</option><option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Color *</label>
              <input type="text" required value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }} placeholder="Pink" />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Model *</label>
              <input type="text" required value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }} placeholder="Opis 60s Mobile" />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }}>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Assigned Venue</label>
              <select value={formData.venueId}
                onChange={(e) => setFormData({...formData, venueId: e.target.value})}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }}>
                <option value="">Unassigned</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-lg font-medium transition"
              style={{ border: '1px solid #E8E6E2', color: '#555', background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
              style={{ border: 'none', cursor: 'pointer' }}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Phone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
