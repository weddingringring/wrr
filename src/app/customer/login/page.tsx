'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (authError) throw authError
      
      // Get user role and redirect accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      if (!profile) throw new Error('Profile not found')
      
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'venue':
          router.push('/venue/dashboard')
          break
        case 'customer':
          router.push('/customer/dashboard')
          break
        default:
          throw new Error('Invalid user role')
      }
    } catch (err: any) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      setSuccessMessage('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-sage-light/20 to-rose-light/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="WeddingRingRing" className="h-12 mx-auto mb-4" />
          <h1 className="font-serif text-3xl text-charcoal mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="text-sage-dark">
            {mode === 'login' ? 'Sign in to your account' : 'Enter your email to receive a reset link'}
          </p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
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
          
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-sm text-sage-dark hover:text-charcoal transition block text-center w-full mt-4"
              >
                Forgot your password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-sm text-sage-dark hover:text-charcoal transition block text-center w-full mt-4"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-sage-dark mt-6">
          Need help? Email{' '}
          <a href="mailto:support@weddingringring.com" className="text-deep-green hover:underline">
            support@weddingringring.com
          </a>
        </p>
      </div>
    </div>
  )
}
