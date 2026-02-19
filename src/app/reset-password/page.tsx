'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRequired = searchParams.get('required') === 'true'
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No user found')

      // Update profile to mark password reset as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ password_reset_required: false })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Get user role to redirect appropriately
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Redirect to appropriate dashboard
      if (profile?.role === 'admin' || profile?.role === 'developer') {
        router.push('/admin')
      } else if (profile?.role === 'venue') {
        router.push('/venue')
      } else if (profile?.role === 'customer') {
        router.push('/customer/dashboard')
      } else {
        router.push('/')
      }

    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-deep-green mb-2">WeddingRingRing</h1>
          {isRequired && (
            <p className="text-sm text-sage-dark">Password Reset Required</p>
          )}
        </div>

        {/* Required Notice */}
        {isRequired && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-charcoal">
              <strong>Action Required:</strong> You must change your password before accessing your account.
            </p>
          </div>
        )}

        <h2 className="text-2xl font-medium text-charcoal mb-6">
          {isRequired ? 'Set Your New Password' : 'Reset Password'}
        </h2>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-charcoal mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green"
              placeholder="Re-enter your password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-green text-white font-medium py-3 rounded-lg hover:bg-sage-dark transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Password Requirements */}
        <div className="mt-6 p-4 bg-sage-light/30 rounded-lg">
          <p className="text-xs font-medium text-charcoal mb-2">Password Requirements:</p>
          <ul className="text-xs text-sage-dark space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Mix of letters, numbers recommended</li>
            <li>• Avoid common passwords</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
