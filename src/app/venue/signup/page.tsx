'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function VenueSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // Business info
    venueName: '',
    businessType: 'wedding_venue',
    
    // Owner info
    fullName: '',
    email: '',
    phone: '',
    password: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    
    // Optional
    website: '',
    instagram: '',
    
    // Business
    estimatedWeddingsPerYear: '',
    subscriptionType: 'rental', // or 'owned'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'venue'
          }
        }
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      
      // Step 2: Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'venue'
        })
      
      if (profileError) throw profileError
      
      // Step 3: Create venue record
      const { error: venueError } = await supabase
        .from('venues')
        .insert({
          owner_id: authData.user.id,
          name: formData.venueName,
          business_type: formData.businessType,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2,
          city: formData.city,
          county: formData.county,
          postcode: formData.postcode,
          country: 'UK',
          primary_contact_name: formData.fullName,
          primary_contact_email: formData.email,
          primary_contact_phone: formData.phone,
          website: formData.website || null,
          instagram_handle: formData.instagram || null,
          subscription_type: formData.subscriptionType,
          subscription_status: 'pending', // Admin needs to approve
          onboarding_completed: false
        })
      
      if (venueError) throw venueError
      
      // Success! Redirect to pending approval page
      router.push('/venue/pending-approval')
      
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-gray-700 mb-2">
            Partner with WeddingRingRing
          </h1>
          <p className="text-sage-dark">
            Offer audio guestbooks at your venue and earn £450+ per event
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-light border border-rose rounded-lg">
            <p className="text-rose-dark">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Business Information */}
          <div>
            <h2 className="font-serif text-2xl text-gray-700 mb-4">Business Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type *
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Weddings Per Year
                </label>
                <input
                  type="number"
                  value={formData.estimatedWeddingsPerYear}
                  onChange={(e) => setFormData({...formData, estimatedWeddingsPerYear: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="50"
                />
              </div>
            </div>
          </div>
          
          {/* Your Details */}
          <div>
            <h2 className="font-serif text-2xl text-gray-700 mb-4">Your Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="jane@thornbury.co.uk"
                />
                <p className="text-sm text-sage-dark mt-1">This will be your login email</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="+44 7700 900123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
          </div>
          
          {/* Venue Address */}
          <div>
            <h2 className="font-serif text-2xl text-gray-700 mb-4">Venue Address</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="SW1A 1AA"
                />
              </div>
            </div>
          </div>
          
          {/* Optional Info */}
          <div>
            <h2 className="font-serif text-2xl text-gray-700 mb-4">Online Presence (Optional)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="https://thornbury.co.uk"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="@thornburymanor"
                />
              </div>
            </div>
          </div>
          
          {/* Subscription Choice */}
          <div>
            <h2 className="font-serif text-2xl text-gray-700 mb-4">How Would You Like to Work With Us?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-lg p-6 transition ${
                formData.subscriptionType === 'rental' 
                  ? 'border-deep-green bg-deep-green/5' 
                  : 'border-sage-light hover:border-sage'
              }`}>
                <input
                  type="radio"
                  name="subscriptionType"
                  value="rental"
                  checked={formData.subscriptionType === 'rental'}
                  onChange={(e) => setFormData({...formData, subscriptionType: e.target.value})}
                  className="sr-only"
                />
                <div className="text-center">
                  <h3 className="font-serif text-xl text-gray-700 mb-2">Rental Model</h3>
                  <p className="text-3xl font-bold text-deep-green mb-2">£50</p>
                  <p className="text-sm text-sage-dark mb-4">per event</p>
                  <ul className="text-sm text-left space-y-2 text-gray-700">
                    <li>✓ Charge couples £500+</li>
                    <li>✓ Keep £450+ profit</li>
                    <li>✓ No upfront costs</li>
                    <li>✓ Try risk-free</li>
                  </ul>
                </div>
              </label>
              
              <label className={`cursor-pointer border-2 rounded-lg p-6 transition ${
                formData.subscriptionType === 'owned' 
                  ? 'border-deep-green bg-deep-green/5' 
                  : 'border-sage-light hover:border-sage'
              }`}>
                <input
                  type="radio"
                  name="subscriptionType"
                  value="owned"
                  checked={formData.subscriptionType === 'owned'}
                  onChange={(e) => setFormData({...formData, subscriptionType: e.target.value})}
                  className="sr-only"
                />
                <div className="text-center">
                  <h3 className="font-serif text-xl text-gray-700 mb-2">Own the Equipment</h3>
                  <p className="text-3xl font-bold text-deep-green mb-2">£1,299</p>
                  <p className="text-sm text-sage-dark mb-4">+ £299/year software</p>
                  <ul className="text-sm text-left space-y-2 text-gray-700">
                    <li>✓ Unlimited events</li>
                    <li>✓ Keep 100% revenue</li>
                    <li>✓ ROI in 3 events</li>
                    <li>✓ Best for busy venues</li>
                  </ul>
                </div>
              </label>
            </div>
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-deep-green text-white rounded-lg font-medium text-lg hover:bg-deep-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
          
          <p className="text-sm text-center text-sage-dark">
            Already have an account?{' '}
            <a href="/venue/login" className="text-deep-green hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
