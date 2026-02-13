'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false)
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
    // Check cookie consent on load
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setCookieBannerVisible(true)
    }

    // ESC key handler
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
        // Auto-close modal after 3 seconds
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
      
      if (!data.user) throw new Error('No user returned from auth')
      
      // Get user role and redirect accordingly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw new Error('Profile not found')
      }
      
      if (!profile) throw new Error('Profile not found')
      
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          window.location.href = '/admin/dashboard'
          break
        case 'venue':
          window.location.href = '/venue/dashboard'
          break
        case 'customer':
          window.location.href = '/customer/dashboard'
          break
        default:
          throw new Error('Invalid user role')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(error.message || 'Invalid email or password')
    } finally {
      setLoginLoading(false)
    }
  }

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setCookieBannerVisible(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setCookieBannerVisible(false)
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
                src="/logo.png" 
                alt="WeddingRingRing" 
                width={400} 
                height={100} 
                priority 
                style={{
                  maxWidth: '200px',
                  height: 'auto'
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
            <Link href="/how-it-works" style={{ 
              color: '#1a1a1a', 
              textDecoration: 'none', 
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              How It Works
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
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: '#1a1a1a',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Get Started
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#1a1a1a',
              padding: '0.5rem'
            }}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#F5E8E8',
          zIndex: 999,
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              fontSize: '2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1a1a1a'
            }}
          >
            ×
          </button>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.25rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500 }}>How It Works</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.25rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500 }}>Log In</Link>
          <button onClick={() => { setModalOpen(true); setMobileMenuOpen(false); }} style={{ background: '#1a1a1a', color: 'white', padding: '1rem 2rem', borderRadius: '0.375rem', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Get Started</button>
        </div>
      )}

      {/* Hero */}
      <section style={{
        position: 'relative',
        background: '#F5E8E8',
        padding: '6rem 0 4rem',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          backgroundImage: 'url(/hero-phones-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4,
          zIndex: 0
        }} />
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '4.5rem',
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              marginBottom: '2rem'
            }}>
              The Audio Guestbook For Venues.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#6a6a6a',
              marginBottom: '3rem'
            }}>
              Memories to listen back to for a lifetime
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  background: '#1a1a1a',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Find Out More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '6rem 0'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: '2rem',
            color: '#F5E8E8'
          }}>
            What We Do.
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#E8C9C9' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              We are the audio guestbook where timeless elegance meets modern convenience. Our vintage-style phones, combined with our modern software, creates an unforgettable audio guestbook experience.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              With a swift 30-second setup on our user-friendly online system, venues can effortlessly enhance their offerings and attract couples seeking that extra touch of charm.
            </p>
            <p style={{ marginBottom: '3rem' }}>
              Elevate your venue, captivate your clients, and ensure every celebration is a resounding success with WeddingRingRing.
            </p>
            <a 
              href="#how-it-works"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#1a1a1a',
                padding: '1rem 2rem',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: '2px solid white',
                transition: 'all 0.2s'
              }}
            >
              Find Out How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Why You Need An Audio Guestbook */}
      <section style={{
        background: '#F5E8E8',
        padding: '6rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '3.5rem',
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem'
            }}>
              Why You Need An Audio Guestbook.
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6a6a6a',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              What does it add to your business?
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Boost Income & Profitability',
                description: 'WeddingRingRing opens up new revenue streams for your venue with premium package options.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Create Lasting Memories',
                description: 'Happy couples return for celebrations and recommend your venue to friends and family.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
                title: 'Attract More Bookings',
                description: 'Stand out in a competitive market with this unique and attractive venue feature.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
                title: 'Word-Of-Mouth Marketing',
                description: 'Delighted customers become your best marketing tool, sharing unforgettable moments.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: 'Low-Effort, High-Impact',
                description: 'Quick online setup and durable vintage phones built to last with minimal effort.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                ),
                title: 'Great Fun For Guests!',
                description: 'Adds an element of fun, allowing guests to contribute heartfelt messages and laughter.'
              }
            ].map((benefit, idx) => (
              <div key={idx} style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: '2rem',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#F5E8E8',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: '#C9A6A6'
                }}>
                  {benefit.icon}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  lineHeight: 1.4,
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: '#1a1a1a'
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#6a6a6a',
                  lineHeight: 1.7
                }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            marginTop: '4rem'
          }}>
            <h3 style={{
              fontSize: '3rem',
              marginBottom: '1.5rem',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 500,
              color: '#1a1a1a'
            }}>
              Want to know more?
            </h3>
            <p style={{
              color: '#6a6a6a',
              marginBottom: '3rem',
              fontSize: '1.25rem',
              maxWidth: '600px',
              margin: '0 auto 3rem'
            }}>
              Get in touch to find out how we can help you host your own audio guestbook
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: '#1a1a1a',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Get In Touch
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '6rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '3.5rem',
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
              color: '#F5E8E8'
            }}>
              The No-Fuss Audio Guestbook
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#E8C9C9'
            }}>
              It only takes a minute!
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '4rem 0'
          }}>
            {[
              {
                number: '1',
                title: 'Before the event',
                description: "Log in and provide the couple's details - we'll handle the rest!"
              },
              {
                number: '2',
                title: 'Day of the event',
                description: 'Punch in the code we provide and the phone is ready to go!'
              },
              {
                number: '3',
                title: 'During the event',
                description: 'Guests pick up, listen to the greeting, leave a message, and hang up.'
              },
              {
                number: '4',
                title: 'After the event',
                description: 'Couples access all messages instantly from their secure online account.'
              }
            ].map((step) => (
              <div key={step.number} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '6rem',
                  fontWeight: 300,
                  color: '#C9A6A6',
                  marginBottom: '1.5rem',
                  lineHeight: 1
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: '#F5E8E8',
                  marginBottom: '1rem',
                  lineHeight: 1.3
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: '#E8C9C9'
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '4rem 0 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            <div>
              <h4 style={{
                marginBottom: '1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#F5E8E8'
              }}>
                Support
              </h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/docs" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Documentation</Link>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/faqs" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>FAQs</Link>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/help" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Help Center</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{
                marginBottom: '1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#F5E8E8'
              }}>
                Company
              </h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/about" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>About</Link>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/contact" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Contact Us</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{
                marginBottom: '1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#F5E8E8'
              }}>
                Legal
              </h4>
              <ul style={{ listStyle: 'none' }}>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/privacy" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</Link>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <Link href="/terms" style={{ color: '#E8C9C9', textDecoration: 'none', fontSize: '0.875rem' }}>Terms</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{
                marginBottom: '1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#F5E8E8'
              }}>
                RingRing Digital Ltd
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.875rem',
                lineHeight: 1.6
              }}>
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
            <p>&copy; 2026 RingRing Digital Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
          style={{
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
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
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
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
                fontFamily: "'Playfair Display', Georgia, serif"
              }}>
                Get In Touch
              </h2>
              <p style={{
                color: '#6a6a6a',
                fontSize: '1rem'
              }}>
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
                  borderRadius: '0.375rem',
                  lineHeight: 1
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

                {/* Success Message */}
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

                {/* Error Message */}
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

      {/* Cookie Banner */}
      {cookieBannerVisible && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          color: '#E8C9C9',
          padding: '1.5rem 0',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              flex: 1,
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              We use cookies to keep you logged in and improve your experience.{' '}
              <Link href="/privacy" style={{ color: '#C9A6A6', textDecoration: 'underline' }}>
                Learn more
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={declineCookies}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#E8C9C9',
                  border: '1px solid #E8C9C9',
                  transition: 'all 0.2s'
                }}
              >
                Decline
              </button>
              <button
                onClick={acceptCookies}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: '#C9A6A6',
                  color: '#1a1a1a',
                  border: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .form-row-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
