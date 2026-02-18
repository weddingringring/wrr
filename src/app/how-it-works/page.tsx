'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HowItWorksPage() {
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

        .step-block {
          margin-bottom: 4rem;
        }

        .step-number-large {
          font-family: var(--font-serif);
          font-size: 6rem;
          color: var(--color-secondary);
          opacity: 0.2;
          line-height: 1;
          margin-bottom: 1rem;
        }

        .step-block h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .step-block p {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--color-text-secondary);
          margin-bottom: 1rem;
        }

        .feature-list {
          list-style: none;
          padding: 0;
        }

        .feature-list li {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          position: relative;
          line-height: 1.7;
        }

        .feature-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--color-secondary);
          font-weight: bold;
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
            <Link href="/about" style={{ 
              color: '#1a1a1a', 
              textDecoration: 'none', 
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              About
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
            How It Works.
          </h1>
          <p className="text-large">
            Setting up your audio guestbook is effortless. Here's exactly what happens from setup to delivery.
          </p>
        </div>
      </section>

      {/* The Process */}
      <section style={{ background: '#1a1a1a', padding: '5rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
          }} className="grid-steps-responsive">
            {[
              {
                number: '01',
                title: 'Get Your Phone',
                description: "Your venue receives its own vintage phone — it stays with you permanently. No shipping, no rentals."
              },
              {
                number: '02',
                title: '30-Second Setup',
                description: "Log in, enter the couple's details, and we handle the rest. Custom greeting generated automatically."
              },
              {
                number: '03',
                title: 'Guests Leave Messages',
                description: "Guests pick up, hear the greeting, and leave a message. No Wi-Fi needed — it just works."
              },
              {
                number: '04',
                title: 'Instant Delivery',
                description: "Messages appear in the couple's secure account immediately. Unlimited access and downloads, forever."
              }
            ].map((step) => (
              <div key={step.number} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: '2.5rem',
                  fontWeight: 300,
                  color: '#C9A6A6',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}>
                  {step.number}
                </span>
                <h3 style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#F5E8E8',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: '#E8C9C9',
                  margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Hardware */}
      <section style={{ background: '#F5E8E8', padding: '6rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '4rem',
            alignItems: 'center'
          }} className="grid-responsive">
            <div>
              <img
                src="/Mockup-9.png"
                alt="WeddingRingRing vintage rotary phone"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '0.5rem',
                }}
              />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                fontWeight: 500,
                letterSpacing: '-0.02em',
                marginBottom: '2rem'
              }}>
                The Hardware.
              </h2>
              <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
                Beautiful vintage rotary phones that your couples will love and your venue will treasure.
              </p>
              
              <ul className="feature-list">
                <li><strong>Battery Powered</strong> - Place it anywhere without worrying about power outlets. Lasts all day on a single charge.</li>
                <li><strong>Cellular Technology</strong> - No Wi-Fi needed. Uses its own cellular connection so it works reliably everywhere in your venue.</li>
                <li><strong>Authentic Vintage Design</strong> - Real rotary dial aesthetic that photographs beautifully and feels premium in hand.</li>
                <li><strong>Built to Last</strong> - Solid construction designed to handle hundreds of events. This isn't a delicate rental - it's yours to keep.</li>
                <li><strong>Dedicated to Your Venue</strong> - Your phone stays with you permanently. No shipping, no logistics, always ready.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Software */}
      <section style={{ background: 'white', padding: '6rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '4rem',
            alignItems: 'center'
          }} className="grid-responsive">
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                fontWeight: 500,
                letterSpacing: '-0.02em',
                marginBottom: '2rem'
              }}>
                The Software.
              </h2>
              <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
                Simple, secure, and accessible anywhere. Built for busy venue managers and excited couples.
              </p>
              
              <ul className="feature-list">
                <li><strong>Works on Any Device</strong> - Manage from your Mac, PC, tablet, or phone. Everything syncs instantly.</li>
                <li><strong>30-Second Setup</strong> - Enter couple's details, we generate everything else. No technical knowledge required.</li>
                <li><strong>Bank-Level Security</strong> - All messages encrypted and stored securely. Only the couple can access their recordings.</li>
                <li><strong>Custom Branding</strong> - Add your venue's logo and colors to the couple's message portal.</li>
                <li><strong>Instant Delivery</strong> - Messages appear in the couple's account immediately. No downloading, no waiting.</li>
                <li><strong>Unlimited Storage</strong> - Couples keep their messages forever with unlimited access and downloads.</li>
              </ul>
            </div>
            <div>
              <img
                src="/Mockup-6.png"
                alt="WeddingRingRing software dashboard on Mac, mobile and tablet"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '0.5rem',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What Makes It Simple */}
      <section style={{ background: '#1a1a1a', color: '#E8C9C9', padding: '6rem 0' }}>
        <div className="content-narrow" style={{ padding: '0 2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#F5E8E8',
            marginBottom: '2rem'
          }}>
            What Makes It So Simple.
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '3rem' }}>
            We've designed every part of the system to require zero technical knowledge from your staff.
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '3rem'
          }} className="grid-responsive">
            <div>
              <h3 style={{ color: '#F5E8E8', marginBottom: '1rem', fontSize: '1.25rem' }}>No Technical Setup</h3>
              <p>
                Your phone arrives ready to use. There's no complicated configuration, no app downloads, no Wi-Fi passwords to enter. It just works.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#F5E8E8', marginBottom: '1rem', fontSize: '1.25rem' }}>No Shipping Logistics</h3>
              <p>
                Unlike rental services, you never have to ship the phone anywhere. It lives at your venue, always ready for the next event.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#F5E8E8', marginBottom: '1rem', fontSize: '1.25rem' }}>No File Management</h3>
              <p>
                Messages automatically sync to the couple's account. You don't have to download, transfer, or email anything.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#F5E8E8', marginBottom: '1rem', fontSize: '1.25rem' }}>No Support Calls</h3>
              <p>
                Everything is designed to be so simple that you'll never need to call support. But if you do, we're here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F5E8E8', padding: '6rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: '2rem'
          }}>
            Ready to Get Started?
          </h2>
          <p className="text-large" style={{ marginBottom: '3rem' }}>
            Get your dedicated phone and start offering this unique experience to your couples.
          </p>
          <button onClick={() => setModalOpen(true)} style={{
            background: '#1a1a1a',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}>
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

      {/* Contact Modal - Same as other pages */}
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
          .grid-steps-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
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
          .step-number-large {
            font-size: 4rem !important;
          }
        }
        @media (max-width: 480px) {
          .grid-steps-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
