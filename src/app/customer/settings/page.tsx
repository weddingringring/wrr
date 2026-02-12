'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CustomerSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  useEffect(() => {
    loadUserData()
  }, [])
  
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Get event details
      const { data: eventData } = await supabase
        .from('events')
        .select('*, venue:venues(name, logo_url)')
        .eq('customer_user_id', user.id)
        .single()
      
      if (eventData) {
        setEvent(eventData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match')
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) throw error
      
      setSuccessMessage('Password updated successfully')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownloadAll = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In production, this would create a ZIP file with all messages
      // For now, just show a success message
      alert('Download all feature would create a ZIP file with all messages and photos')
    } catch (err: any) {
      setError('Failed to download messages')
    } finally {
      setLoading(false)
    }
  }
  
  const handleExportData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get all messages for this event
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', event.id)
        .order('recorded_at', { ascending: true })
      
      if (!messages) throw new Error('No messages found')
      
      // Create CSV
      const headers = ['Date', 'Time', 'Guest Name', 'Duration (seconds)', 'Notes', 'Tags', 'Is Favorite']
      const rows = messages.map(m => [
        new Date(m.recorded_at).toLocaleDateString('en-GB'),
        new Date(m.recorded_at).toLocaleTimeString('en-GB'),
        m.caller_name || 'Unknown',
        m.duration,
        m.notes || '',
        ((m as any).tags || []).join('; '),
        m.is_favorite ? 'Yes' : 'No'
      ])
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.partner_1_name}-messages.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccessMessage('Message list exported successfully')
    } catch (err: any) {
      setError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  const getEventDisplayName = () => {
    if (!event) return ''
    
    if (event.event_type === 'wedding') {
      return event.partner_2_name 
        ? `${event.partner_1_name} & ${event.partner_2_name}'s Wedding`
        : `${event.partner_1_name}'s Wedding`
    }
    return `${event.partner_1_name}'s ${event.event_type}`
  }
  
  if (!user || !event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin"></div>
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
              {event.venue?.logo_url && (
                <img 
                  src={event.venue.logo_url} 
                  alt={event.venue.name}
                  className="h-12 w-auto object-contain"
                />
              )}
              <div className="flex items-center gap-2 text-xs text-sage-dark border-l border-sage-light pl-3">
                <span>Powered by</span>
                <img src="/logo.svg" alt="WeddingRingRing" className="h-6" />
              </div>
            </div>
            
            <Link
              href="/customer/dashboard"
              className="text-sm text-sage-dark hover:text-charcoal transition"
            >
              ← Back to Messages
            </Link>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-4xl text-charcoal mb-2">Settings</h1>
        <p className="text-sage-dark mb-8">{getEventDisplayName()}</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-light/50 border border-rose-light rounded-lg">
            <p className="text-sm text-rose-dark">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-deep-green/10 border border-deep-green/30 rounded-lg">
            <p className="text-sm text-deep-green">{successMessage}</p>
          </div>
        )}
        
        <div className="space-y-6">
          
          {/* Account Info */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Account Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-dark mb-1">
                  Email Address
                </label>
                <p className="text-charcoal">{user.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-dark mb-1">
                  Event
                </label>
                <p className="text-charcoal">{getEventDisplayName()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-dark mb-1">
                  Event Date
                </label>
                <p className="text-charcoal">
                  {new Date(event.event_date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-dark mb-1">
                  Venue
                </label>
                <p className="text-charcoal">{event.venue?.name}</p>
              </div>
            </div>
          </section>
          
          {/* Sharing Access */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Share Access
            </h2>
            
            <div className="space-y-4">
              <p className="text-sage-dark">
                To share access with your partner or family members, simply give them your login credentials:
              </p>
              
              <div className="p-4 bg-sage-light/20 rounded-lg">
                <p className="text-sm font-medium text-charcoal mb-2">Login Details to Share:</p>
                <p className="text-sm text-charcoal mb-1">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm text-charcoal">
                  <strong>Password:</strong> Your password (they'll need to ask you)
                </p>
              </div>
              
              <div className="p-4 bg-deep-green/5 border border-deep-green/20 rounded-lg">
                <p className="text-sm text-deep-green">
                  <strong>💡 Tip:</strong> Everyone with these credentials will be able to view, organize, and download messages. Only share with people you trust.
                </p>
              </div>
            </div>
          </section>
          
          {/* Change Password */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-sage-dark mt-1">At least 8 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
          
          {/* Export & Download */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Export & Download
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-charcoal mb-2">Download All Messages</h3>
                <p className="text-sm text-sage-dark mb-3">
                  Download all voice messages and photos as a ZIP file to keep forever.
                </p>
                <button
                  onClick={handleDownloadAll}
                  disabled={loading}
                  className="px-6 py-3 bg-rose text-white rounded-lg font-medium hover:bg-rose-dark transition disabled:opacity-50"
                >
                  Download ZIP File
                </button>
              </div>
              
              <div className="pt-4 border-t border-sage-light">
                <h3 className="font-medium text-charcoal mb-2">Export Message List (CSV)</h3>
                <p className="text-sm text-sage-dark mb-3">
                  Export a spreadsheet with message details (guest names, dates, notes, tags).
                </p>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="px-6 py-3 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition disabled:opacity-50"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </section>
          
          {/* Sign Out */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-4 border-b border-sage-light">
              Account Actions
            </h2>
            
            <button
              onClick={handleSignOut}
              className="px-6 py-3 border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition"
            >
              Sign Out
            </button>
          </section>
          
        </div>
      </div>
    </div>
  )
}
