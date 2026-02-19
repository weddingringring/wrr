'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Lock, Check, Eye, EyeOff } from 'lucide-react'

interface PasswordResetModalProps {
  /** Called after successful password change — parent should reload data */
  onComplete?: () => void
}

export default function PasswordResetModal({ onComplete }: PasswordResetModalProps) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Check on mount whether this user needs a password reset
  useEffect(() => {
    checkPasswordResetRequired()
  }, [])

  const checkPasswordResetRequired = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChecking(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('password_reset_required')
        .eq('id', user.id)
        .single()

      if (profile?.password_reset_required) {
        setVisible(true)
      }
    } catch (err) {
      console.error('Password reset check error:', err)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async () => {
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords don\u2019t match.')
      return
    }

    setLoading(true)

    try {
      // 1. Update the auth password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (updateError) throw updateError

      // 2. Clear the flag on their profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session lost')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ password_reset_required: false })
        .eq('id', user.id)

      if (profileError) throw profileError

      setSuccess(true)

      // Auto-dismiss after a moment
      setTimeout(() => {
        setVisible(false)
        if (onComplete) onComplete()
      }, 2000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Strength indicator
  const getStrength = () => {
    if (!newPassword) return { level: 0, label: '', color: '#E8E6E2' }
    if (newPassword.length < 8) return { level: 1, label: 'Too short', color: '#dc3545' }
    const hasUpper = /[A-Z]/.test(newPassword)
    const hasLower = /[a-z]/.test(newPassword)
    const hasNum = /[0-9]/.test(newPassword)
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
    const score = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length
    if (newPassword.length >= 12 && score >= 3) return { level: 4, label: 'Strong', color: '#3D5A4C' }
    if (newPassword.length >= 8 && score >= 2) return { level: 3, label: 'Good', color: '#6a9b7e' }
    return { level: 2, label: 'Fair', color: '#d4a847' }
  }

  const strength = getStrength()

  // Don't render anything while checking, or if not needed
  if (checking || !visible) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '0.75rem',
        maxWidth: '440px', width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>

        {/* ─── SUCCESS STATE ─── */}
        {success ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(61, 90, 76, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
            }}>
              <Check size={28} style={{ color: '#3D5A4C' }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
              color: '#111', marginBottom: '0.5rem'
            }}>Password Updated</h2>
            <p style={{ fontSize: '0.875rem', color: '#777', lineHeight: 1.5 }}>
              You're all set. Redirecting to your dashboard…
            </p>
          </div>
        ) : (
          <>
            {/* ─── HEADER ─── */}
            <div style={{
              padding: '2rem 2rem 0', textAlign: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(61, 90, 76, 0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <Lock size={22} style={{ color: '#3D5A4C' }} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
                color: '#111', marginBottom: '0.375rem', letterSpacing: '-0.02em'
              }}>Set Your Password</h2>
              <p style={{ fontSize: '0.8125rem', color: '#888', lineHeight: 1.5, maxWidth: '320px', margin: '0 auto' }}>
                For security, please choose a personal password to replace the temporary one we sent you.
              </p>
            </div>

            {/* ─── FORM ─── */}
            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              {error && (
                <div style={{
                  padding: '0.625rem 0.875rem', background: 'rgba(180,60,60,0.06)',
                  border: '1px solid rgba(180,60,60,0.15)', borderRadius: '0.375rem',
                  color: '#a33', marginBottom: '1rem', fontSize: '0.8125rem'
                }}>{error}</div>
              )}

              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#333', marginBottom: '0.375rem' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoFocus
                      style={{
                        width: '100%', padding: '0.625rem 2.75rem 0.625rem 0.875rem',
                        border: '1px solid #E8E6E2', borderRadius: '0.375rem',
                        fontSize: '0.9375rem', color: '#111', outline: 'none'
                      }}
                      className="placeholder:text-gray-400"
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '0.25rem'
                      }}
                    >{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: i <= strength.level ? strength.color : '#E8E6E2',
                            transition: 'background 0.2s'
                          }} />
                        ))}
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: strength.color, fontWeight: 500 }}>{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#333', marginBottom: '0.375rem' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      style={{
                        width: '100%', padding: '0.625rem 2.75rem 0.625rem 0.875rem',
                        border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(180,60,60,0.4)' : '#E8E6E2'}`,
                        borderRadius: '0.375rem', fontSize: '0.9375rem', color: '#111', outline: 'none'
                      }}
                      className="placeholder:text-gray-400"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '0.25rem'
                      }}
                    >{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ fontSize: '0.6875rem', color: '#a33', marginTop: '0.25rem' }}>Passwords don't match</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !newPassword || !confirmPassword}
                style={{
                  width: '100%', marginTop: '1.5rem',
                  padding: '0.75rem', borderRadius: '0.375rem',
                  fontSize: '0.875rem', fontWeight: 600,
                  border: 'none', background: '#3D5A4C', color: 'white',
                  cursor: (loading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !newPassword || !confirmPassword) ? 0.6 : 1,
                  transition: 'opacity 0.15s'
                }}
              >{loading ? 'Updating…' : 'Set Password'}</button>

              <p style={{
                fontSize: '0.6875rem', color: '#bbb', textAlign: 'center',
                marginTop: '1rem', lineHeight: 1.4
              }}>
                You won't be asked again after setting your password.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
