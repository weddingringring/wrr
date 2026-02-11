'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Phone {
  id: string
  serial_number: string
  imei: string
  sim_number: string
  sim_provider: string
  color: string
  model: string
  status: string
  venue: {
    name: string
  } | null
  created_at: string
}

export default function AdminPhonesPage() {
  const [phones, setPhones] = useState<Phone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  
  useEffect(() => {
    loadPhones()
  }, [])
  
  const loadPhones = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select(`
          *,
          venue:venues(name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPhones(data || [])
    } catch (error) {
      console.error('Error loading phones:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading inventory...</p>
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
              <h1 className="font-serif text-3xl text-charcoal">Phone Inventory</h1>
              <p className="text-sm text-sage-dark mt-1">Manage physical phone devices</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
            >
              + Add Phone
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-sage-dark mb-1">Total Phones</p>
            <p className="text-2xl font-bold text-charcoal">{phones.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-sage-dark mb-1">Available</p>
            <p className="text-2xl font-bold text-deep-green">
              {phones.filter(p => p.status === 'available').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-sage-dark mb-1">In Use</p>
            <p className="text-2xl font-bold text-sage-dark">
              {phones.filter(p => p.status === 'in_use').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-sage-dark mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-rose">
              {phones.filter(p => p.status === 'maintenance').length}
            </p>
          </div>
        </div>
        
        {/* Phones Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {phones.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-sage-dark mb-2">No phones in inventory</p>
              <p className="text-sm text-sage-dark mb-6">
                Add your first phone to start tracking inventory
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-block px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
              >
                + Add Phone
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sage-light/20 border-b border-sage-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Serial / IMEI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      SIM Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                      Assigned To
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
                  {phones.map((phone) => (
                    <tr key={phone.id} className="hover:bg-sage-light/10 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-charcoal">
                            {phone.color} {phone.model}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-charcoal font-mono">{phone.serial_number}</div>
                          <div className="text-sage-dark font-mono text-xs">{phone.imei}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-charcoal font-mono">{phone.sim_number}</div>
                          <div className="text-sage-dark">{phone.sim_provider}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal">
                          {phone.venue?.name || '—'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          phone.status === 'available'
                            ? 'bg-deep-green/10 text-deep-green'
                            : phone.status === 'in_use'
                            ? 'bg-sage/10 text-sage-dark'
                            : phone.status === 'maintenance'
                            ? 'bg-rose/10 text-rose-dark'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {phone.status.replace('_', ' ')}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-sm text-deep-green hover:text-deep-green-dark font-medium"
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
      
      {/* Add Phone Modal */}
      {showAddModal && (
        <AddPhoneModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadPhones()
          }}
        />
      )}
    </div>
  )
}

// Add Phone Modal Component
function AddPhoneModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    serialNumber: '',
    imei: '',
    simNumber: '',
    simProvider: 'EE',
    color: 'Pink',
    model: 'Opis 60s Mobile',
    status: 'available'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('phones')
        .insert({
          serial_number: formData.serialNumber,
          imei: formData.imei,
          sim_number: formData.simNumber,
          sim_provider: formData.simProvider,
          color: formData.color,
          model: formData.model,
          status: formData.status
        })
      
      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error adding phone:', error)
      alert('Failed to add phone')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-sage-light">
          <h2 className="font-serif text-2xl text-charcoal">Add New Phone</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
                placeholder="OPIS001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                IMEI *
              </label>
              <input
                type="text"
                required
                value={formData.imei}
                onChange={(e) => setFormData({...formData, imei: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
                placeholder="123456789012345"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                SIM Number *
              </label>
              <input
                type="tel"
                required
                value={formData.simNumber}
                onChange={(e) => setFormData({...formData, simNumber: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
                placeholder="+447700900000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                SIM Provider *
              </label>
              <select
                required
                value={formData.simProvider}
                onChange={(e) => setFormData({...formData, simProvider: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
              >
                <option value="EE">EE</option>
                <option value="Vodafone">Vodafone</option>
                <option value="O2">O2</option>
                <option value="Three">Three</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Color *
              </label>
              <input
                type="text"
                required
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
                placeholder="Pink"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="w-full px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
                placeholder="Opis 60s Mobile"
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-sage text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Phone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
