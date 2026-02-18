'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'

export default function AdminCreateVenuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // Business info
    venueName: '',
    businessType: 'wedding_venue',
    
    // Owner account
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    countryCode: 'GB', // ISO 3166-1 alpha-2 for Twilio
    
    // Optional
    website: '',
    instagram: '',
    facebook: '',
    
    // Subscription
    subscriptionType: 'rental',
    subscriptionStatus: 'active',
  })
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Create auth user for venue owner
      const temporaryPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.ownerEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.ownerName,
          role: 'venue'
        }
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      
      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.ownerEmail,
          full_name: formData.ownerName,
          phone: formData.ownerPhone,
          role: 'venue'
        })
      
      if (profileError) throw profileError
      
      // Step 3: Upload logo if provided
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `${authData.user.id}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('venue-logos')
          .upload(filePath, logoFile, { upsert: true })
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('venue-logos')
          .getPublicUrl(filePath)
        
        logoUrl = publicUrl
      }
      
      // Step 4: Create venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          owner_id: authData.user.id,
          name: formData.venueName,
          business_type: formData.businessType,
          logo_url: logoUrl,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2 || null,
          city: formData.city,
          county: formData.county,
          postcode: formData.postcode,
          country: 'UK', // Display name (legacy)
          country_code: formData.countryCode, // ISO code for Twilio
          primary_contact_name: formData.ownerName,
          primary_contact_email: formData.ownerEmail,
          primary_contact_phone: formData.ownerPhone,
          website: formData.website || null,
          instagram_handle: formData.instagram || null,
          facebook_page: formData.facebook || null,
          subscription_type: formData.subscriptionType,
          subscription_status: formData.subscriptionStatus,
          is_active: true
        })
        .select()
        .single()
      
      if (venueError) throw venueError
      
      // Step 4: Send password setup email
      // Note: In production, you'd send via your email service
      // For now, we'll use Supabase's password reset flow
      await supabase.auth.resetPasswordForEmail(formData.ownerEmail, {
        redirectTo: `${window.location.origin}/venue/set-password`
      })
      
      // Success!
      alert(`Venue created successfully!\n\nPassword reset email sent to ${formData.ownerEmail}`)
      router.push('/admin/venues')
      
    } catch (err: any) {
      console.error('Create venue error:', err)
      setError(err.message || 'Failed to create venue')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader currentPage="venues" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <Link href="/admin/venues" className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
            &larr; Back to Venues
          </Link>
          <h1 className="font-serif text-3xl text-charcoal">Create New Venue</h1>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-rose-light border border-rose rounded-lg">
            <p className="text-rose-dark font-medium">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Business Information */}
          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-sage-light">
              Business Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.venueName}
                  onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="Thornbury Manor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Business Type *
                </label>
                <select
                  required
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                >
                  <option value="wedding_venue">Wedding Venue</option>
                  <option value="hotel">Hotel</option>
                  <option value="barn">Barn</option>
                  <option value="manor">Manor House</option>
                  <option value="garden">Garden Venue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Venue Logo (Optional)
                </label>
                <div className="flex items-start gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-20 w-auto object-contain border border-sage-light rounded p-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose text-white rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                      className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    />
                    <p className="text-xs text-sage-dark mt-2">
                      <strong>Recommended:</strong> PNG or SVG with transparent background<br/>
                      <strong>Resolution:</strong> 400×200px minimum (2:1 aspect ratio preferred)<br/>
                      <strong>File size:</strong> Under 500KB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Owner Account */}
          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-sage-light">
              Owner Account
            </h2>
            <p className="text-sm text-sage-dark mb-4">
              This person will receive an email to set their password and can log in to manage events.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="jane@venue.com"
                />
                <p className="text-xs text-sage-dark mt-1">Password setup email will be sent here</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="+44 7700 900000"
                />
              </div>
            </div>
          </section>
          
          {/* Venue Address */}
          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-sage-light">
              Venue Address
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="123 High Street"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="London"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    County *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.county}
                    onChange={(e) => setFormData({...formData, county: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="Greater London"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postcode}
                    onChange={(e) => setFormData({...formData, postcode: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                    placeholder="SW1A 1AA"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Country *
                  </label>
                  <select
                    required
                    value={formData.countryCode}
                    onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  >
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="NZ">🇳🇿 New Zealand</option>
                    <option value="IE">🇮🇪 Ireland</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="ES">🇪🇸 Spain</option>
                    <option value="IT">🇮🇹 Italy</option>
                    <option value="NL">🇳🇱 Netherlands</option>
                    <option value="BE">🇧🇪 Belgium</option>
                    <option value="SE">🇸🇪 Sweden</option>
                    <option value="NO">🇳🇴 Norway</option>
                    <option value="DK">🇩🇰 Denmark</option>
                    <option value="FI">🇫🇮 Finland</option>
                  </select>
                  <p className="text-xs text-sage-dark mt-1">
                    Determines phone number country for events
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Online Presence (Optional) */}
          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-sage-light">
              Online Presence <span className="text-sm font-normal text-sage-dark">(Optional)</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="https://venue.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="@venuename"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Facebook Page
                </label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="https://facebook.com/venuename"
                />
              </div>
            </div>
          </section>
          
          {/* Subscription */}
          <section>
            <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-sage-light">
              Subscription
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Subscription Type *
                </label>
                <select
                  required
                  value={formData.subscriptionType}
                  onChange={(e) => setFormData({...formData, subscriptionType: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                >
                  <option value="rental">Rental (£50/event)</option>
                  <option value="owned">Owned Equipment (£299/year)</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Status *
                </label>
                <select
                  required
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData({...formData, subscriptionStatus: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/venues"
              className="flex-1 py-3 border-2 border-sage text-charcoal rounded-lg font-medium text-center hover:bg-sage-light/30 transition"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Venue...' : 'Create Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
