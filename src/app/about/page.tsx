'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    venueName: '',
    email: '',
    phone: '',
    message: '',
    interest: 'venue'
  })
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false)
        setLoginModalOpen(false)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    setFormSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormSuccess(true)
        setFormData({
          name: '',
          venueName: '',
          email: '',
          phone: '',
          message: '',
          interest: 'venue'
        })
        setTimeout(() => {
          setModalOpen(false)
          setFormSuccess(false)
        }, 3000)
      } else {
        setFormError('Something went wrong. Please try again or email us directly.')
      }
    } catch (error) {
      console.error('Form error:', error)
      setFormError('Unable to send message. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
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
        case 'developer':
          window.location.href = '/admin/dashboard'
          break
        case 'venue':
          window.location.href = '/venue/dashboard'
          break
        case 'customer':
          window.location.href = '/customer/dashboard'
          break
        default:
          window.location.href = '/dashboard'
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(error.message || 'Invalid email or password')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        
        :root {
          --color-primary: #1a1a1a;
          --color-secondary: #C9A6A6;
          --color-text-primary: #1a1a1a;
          --color-text-secondary: #6a6a6a;
          --color-surface-white: #ffffff;
          --color-surface-cream: #FAF8F3;
          --color-surface-blush: #F5E8E8;
          --color-border: rgba(0, 0, 0, 0.08);
          --color-text-on-dark: #E8C9C9;
          --color-heading-on-dark: #F5E8E8;
          --font-serif: 'Playfair Display', Georgia, serif;
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: var(--font-sans);
          line-height: 1.7;
          color: var(--color-text-primary);
          background: var(--color-surface-cream);
        }

        .content-narrow {
          max-width: 900px;
          margin: 0 auto;
        }

        .text-large {
          font-size: 1.25rem;
          line-height: 1.8;
          color: var(--color-text-secondary);
        }

        .space-y-6 > * + * {
          margin-top: 1.5rem;
        }

        .number-card {
          text-align: center;
          padding: 2rem;
        }

        .number {
          font-family: var(--font-serif);
          font-size: 3rem;
          color: var(--color-secondary);
          opacity: 0.3;
          margin-bottom: 1rem;
        }

        .border-accent {
          border-left: 3px solid var(--color-secondary);
          padding-left: 2rem;
          margin-bottom: 2rem;
        }

        .border-accent h3 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .border-accent p {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--color-text-secondary);
        }

        .btn-white {
          background: white;
          color: var(--color-primary);
          padding: 1rem 2rem;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-white:hover {
          background: var(--color-secondary);
          color: white;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: '#F5E8E8',
        padding: '1.5rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link href="/">
              <Image 
                src="/logo.svg" 
                alt="WeddingRingRing" 
                width={180} 
                height={45} 
                priority 
                style={{
                  imageRendering: 'crisp-edges',
                  shapeRendering: 'crispEdges',
                  filter: 'none'
                }}
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav style={{ 
            display: 'flex', 
            gap: '3rem', 
            alignItems: 'center' 
          }} className="nav-desktop">
            <Link href="/" style={{ 
              color: '#1a1a1a', 
              textDecoration: 'none', 
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              Home
            </Link>
            <Link href="/how-it-works" style={{ 
              color: '#1a1a1a', 
              textDecoration: 'none', 
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              How It Works
            </Link>
            <button 
              onClick={() => setLoginModalOpen(true)}
              style={{ 
                color: '#6a6a6a', 
                textDecoration: 'none', 
                fontWeight: 500,
                fontSize: '0.875rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Log In
            </button>
            <button onClick={() => setModalOpen(true)} style={{
              background: '#1a1a1a',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}>
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: '#F5E8E8', padding: '6rem 0' }}>
        <div className="content-narrow" style={{ padding: '0 2rem' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-serif)',
            fontSize: '4.5rem',
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: '-0.03em',
            marginBottom: '2rem'
          }}>
            About WeddingRingRing.
          </h1>
          <p className="text-large">
            We believe every wedding deserves to be remembered not just in photos, but in the voices and laughter of the people who matter most.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section style={{ background: '#1a1a1a', color: '#E8C9C9', padding: '6rem 0' }}>
        <div className="content-narrow" style={{ padding: '0 2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#F5E8E8',
            marginBottom: '3rem'
          }}>
            Our Story.
          </h2>
          <div className="space-y-6" style={{ fontSize: '1.125rem' }}>
            <p>
              WeddingRingRing was born from a simple observation: traditional guest books sit forgotten on shelves, their heartfelt messages rarely revisited. We knew there had to be a better way to capture the emotion of a wedding day.
            </p>
            <p>
              Our founder, Callum, loved the idea of an audio guestbook for his own wedding but hated the reality - having to rent and send a phone to a company, then wait days for messages to be downloaded and returned. He knew there had to be a simpler way.
            </p>
            <p>
              So he designed it himself. A vintage phone that stays permanently at the venue, battery-powered and using cellular technology so it works anywhere. No shipping, no waiting, no hassle. Just plug it in, and couples get their messages instantly.
            </p>
            <p>
              Today, we partner with venues across the UK, helping them offer couples an experience that goes beyond the ordinary. Every venue gets their own dedicated phone that lives on-site, ready whenever they need it. Every message captured is a memory preserved forever.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section style={{ background: '#F5E8E8', padding: '6rem 0' }}>
        <div className="content-narrow" style={{ padding: '0 2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: '2rem'
          }}>
            Our Mission.
          </h2>
          <p className="text-large" style={{ marginBottom: '3rem' }}>
            To make preserving authentic wedding memories effortless for venues and unforgettable for couples.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }} className="grid-responsive">
            <div className="number-card">
              <div className="number">01</div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Simple for Venues</h3>
              <p style={{ color: '#6a6a6a' }}>Each venue gets their own dedicated phone that stays on-site. Battery-powered and cellular-enabled - works anywhere, anytime.</p>
            </div>

            <div className="number-card">
              <div className="number">02</div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Magical for Couples</h3>
              <p style={{ color: '#6a6a6a' }}>Messages delivered instantly to couples' secure online accounts. No waiting, no shipping phones back and forth.</p>
            </div>

            <div className="number-card">
              <div className="number">03</div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Built to Last</h3>
              <p style={{ color: '#6a6a6a' }}>Vintage aesthetic, modern reliability. Battery-powered with cellular technology means it works every single time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Venues Trust Us */}
      <section style={{ background: 'white', padding: '6rem 0' }}>
        <div className="content-narrow" style={{ padding: '0 2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: '4rem',
            textAlign: 'center'
          }}>
            Why Venues Trust Us.
          </h2>

          <div className="border-accent">
            <h3>No Technical Expertise Needed</h3>
            <p>
              Your staff doesn't need to be tech-savvy. Each venue gets their own dedicated phone that lives on-site permanently. It's battery-powered and uses cellular technology, so it works anywhere in your venue without Wi-Fi setup or complicated configuration.
            </p>
          </div>

          <div className="border-accent">
            <h3>It Just Works</h3>
            <p>
              No Wi-Fi dropouts. No app downloads. No battery anxiety. Our cellular-enabled system has been designed to be absolutely bulletproof. Your phone stays at your venue, always charged, always ready. You never have to ship it anywhere.
            </p>
          </div>

          <div className="border-accent">
            <h3>We Handle Everything</h3>
            <p>
              Unlike rental services where you ship phones back and forth, your dedicated phone stays with you. Setup takes 30 seconds online. Couples get their messages delivered automatically to their secure account. You get glowing reviews. We handle all the behind-the-scenes technology.
            </p>
          </div>

          <div className="border-accent">
            <h3>Built for Beautiful Venues</h3>
            <p>
              Our vintage phones aren't just functional - they're beautiful. They photograph well, they feel premium, and they add a touch of elegance to your space. Because they're battery-powered and cellular-enabled, you can place them anywhere that looks best, not just near power outlets or Wi-Fi routers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1a1a1a', color: '#E8C9C9', padding: '6rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#F5E8E8',
            marginBottom: '2rem'
          }}>
            Ready to Add This to Your Venue?
          </h2>
          <p className="text-large" style={{ marginBottom: '3rem' }}>
            Join venues across the UK creating unforgettable memories for their couples.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-white">
            Get In Touch
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '4rem 0 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            <div>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: 600, color: '#F5E8E8' }}>Support</h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}><Link href="/docs" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Documentation</Link></li>
                <li style={{ marginBottom: '1rem' }}><Link href="/faqs" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>FAQs</Link></li>
                <li style={{ marginBottom: '1rem' }}><Link href="/help" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: 600, color: '#F5E8E8' }}>Company</h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}><Link href="/about" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>About</Link></li>
                <li style={{ marginBottom: '1rem' }}><Link href="/contact" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: 600, color: '#F5E8E8' }}>Legal</h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}><Link href="/privacy" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</Link></li>
                <li style={{ marginBottom: '1rem' }}><Link href="/terms" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: 600, color: '#F5E8E8' }}>Wedding RingRing Ltd</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                The audio guestbook for venues.
              </p>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '2rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem'
          }}>
            <p>&copy; 2026 Wedding RingRing Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Contact Modal - Same as homepage */}
      {modalOpen && (
        <div onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false)
        }} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{
              padding: '3rem 3rem 2rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                marginBottom: '0.5rem'
              }}>Get In Touch</h2>
              <p style={{ color: '#6a6a6a', fontSize: '1rem' }}>
                Tell us about your venue and we'll be in touch within 24 hours
              </p>
              <button 
                onClick={() => setModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6a6a6a',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '3rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }} className="form-row-responsive">
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Smith"
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venueName}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      placeholder="The Grand Ballroom"
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }} className="form-row-responsive">
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@venue.com"
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 20 1234 5678"
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    I'm interested as a... *
                  </label>
                  <select
                    required
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      background: 'white'
                    }}
                  >
                    <option value="venue">Venue Owner/Manager</option>
                    <option value="couple">Engaged Couple</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    Tell us about your venue (optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your venue..."
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {formSuccess && (
                  <div style={{
                    padding: '1rem',
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '0.375rem',
                    color: '#155724',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    ✓ Thank you! We'll be in touch as soon as possible.
                  </div>
                )}

                {formError && (
                  <div style={{
                    padding: '1rem',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '0.375rem',
                    color: '#721c24',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#1a1a1a',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>

                <p style={{
                  fontSize: '0.875rem',
                  color: '#6a6a6a',
                  textAlign: 'center'
                }}>
                  We'll respond within 24 hours
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {loginModalOpen && (
        <div onClick={(e) => {
          if (e.target === e.currentTarget) setLoginModalOpen(false)
        }} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            maxWidth: '450px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{
              padding: '3rem 3rem 2rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>Welcome Back</h2>
              <p style={{ color: '#6a6a6a', fontSize: '1rem', textAlign: 'center' }}>
                Sign in to your account
              </p>
              <button 
                onClick={() => setLoginModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6a6a6a',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '3rem' }}>
              <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {loginError && (
                  <div style={{
                    padding: '1rem',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '0.375rem',
                    color: '#721c24',
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}>
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{
                    background: '#1a1a1a',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                    opacity: loginLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <Link href="/login" style={{
                    fontSize: '0.875rem',
                    color: '#6a6a6a',
                    textDecoration: 'none'
                  }}>
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
          .form-row-responsive {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 2.5rem !important;
          }
          h2 {
            font-size: 2rem !important;
          }
        }
      `}</style>
    </>
  )
}
