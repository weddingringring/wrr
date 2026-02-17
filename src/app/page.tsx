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
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }} style={{ fontSize: '1.25rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500 }}>How It Works</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.25rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500 }}>Log In</Link>
          <button onClick={() => { setModalOpen(true); setMobileMenuOpen(false); }} style={{ background: '#1a1a1a', color: 'white', padding: '1rem 2rem', borderRadius: '0.375rem', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Get Started</button>
        </div>
      )}

      {/* Hero */}
      <section style={{
        position: 'relative',
        background: '#F5E8E8',
        padding: '7rem 0 5rem',
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
              fontSize: '5.2rem',
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
              marginTop: '1rem'
            }}>
              The Audio Guestbook For Venues.
            </h1>
            <p style={{
              fontSize: '1.35rem',
              color: '#4a4a4a',
              marginBottom: '1rem'
            }}>
              A luxury audio experience your couples will pay extra for.
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#6a6a6a',
              opacity: 0.8,
              marginBottom: '4rem'
            }}>
              Effortless to run. Instantly memorable. Fully branded for your venue — generating up to £350 per wedding.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3.5rem' }}>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-block',
                  background: '#1a1a1a',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Discover How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '7rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '3.5rem',
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: '2rem',
              color: '#F5E8E8'
            }}>
              A Premium Add-On, Fully Managed For You.
            </h2>
            <div style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#E8C9C9', maxWidth: '540px' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                WeddingRingRing allows your venue to offer a beautifully designed vintage-style audio guestbook — without adding complexity to your team's day.
              </p>
              <p style={{ marginBottom: '0.25rem' }}>
                We provide the hardware, the software, and the support.
              </p>
              <p style={{ marginBottom: '2rem', fontWeight: 500, color: '#F5E8E8' }}>
                You provide the setting.
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                Couples receive instant access to their recordings in a secure online gallery — beautifully branded with your venue identity.
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                Guests can share recordings directly to Instagram Stories — extending your venue's reach beyond the wedding day.
              </p>
              <p style={{ marginBottom: '3rem' }}>
                You benefit from an elegant feature capable of generating up to £350 per wedding while strengthening your brand presence.
              </p>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-block',
                  background: 'white',
                  color: '#1a1a1a',
                  padding: '1rem 2rem',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: '2px solid white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                See How Simple It Is
              </button>
            </div>
          </div>
          <div style={{ flex: '1 1 350px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/Mockup-7.png"
              alt="WeddingRingRing app dashboard showing voice messages from wedding guests"
              style={{
                width: '100%',
                maxWidth: '480px',
                height: 'auto',
                borderRadius: '12px',
              }}
            />
          </div>
        </div>
      </section>

      {/* Why Leading Venues Offer Audio Guestbooks */}
      <section style={{
        background: '#F5E8E8',
        padding: '7rem 0'
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
              Why Leading Venues Offer Audio Guestbooks
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
                title: 'Additional Revenue Per Wedding',
                description: 'Generate up to £350 per event through a premium upgrade couples genuinely value.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Zero Operational Burden',
                description: 'No installation. No technical setup. No ongoing management.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: 'Elevated Guest Experience',
                description: 'Adds atmosphere, charm, and interaction to your space.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                ),
                title: 'Stand Out In A Competitive Market',
                description: 'Differentiate your venue with a modern yet timeless feature.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
                title: 'Word-Of-Mouth Marketing',
                description: 'Guests share recordings to Instagram Stories — with your venue branding included.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                  </svg>
                ),
                title: 'Branded To Your Venue',
                description: 'Custom-branded guestbooks and social sharing features reinforce your venue identity with every recording.'
              }
            ].map((benefit, idx) => (
              <div key={idx} style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: '2.5rem',
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
                  fontSize: '1.2rem',
                  lineHeight: 1.4,
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#1a1a1a'
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontSize: '0.9375rem',
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
            padding: '6rem 0',
            marginTop: '4rem'
          }}>
            <h3 style={{
              fontSize: '3rem',
              marginBottom: '1.5rem',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 500,
              color: '#1a1a1a'
            }}>
              Ready To Add A New Premium Revenue Stream?
            </h3>
            <p style={{
              color: '#6a6a6a',
              marginBottom: '3rem',
              fontSize: '1.25rem',
              maxWidth: '600px',
              margin: '0 auto 3rem'
            }}>
              Let's explore how WeddingRingRing could integrate seamlessly into your venue and enhance your offering.
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
              Book A Conversation
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        background: '#1a1a1a',
        color: '#E8C9C9',
        padding: '4.8rem 0 4.7rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
              No installation. No training. No stress.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '3rem 0'
          }}>
            {[
              {
                number: '1',
                title: 'Before The Event',
                description: "Log in and enter the couple's details. We handle the rest."
              },
              {
                number: '2',
                title: 'Day Of The Event',
                description: 'The phone arrives ready. Plug in and place it beautifully.'
              },
              {
                number: '3',
                title: 'During The Event',
                description: 'Guests pick up, listen to the greeting, leave a message, and hang up.'
              },
              {
                number: '4',
                title: 'After The Event',
                description: 'Couples access their recordings instantly via their private online gallery — fully branded to your venue.'
              }
            ].map((step) => (
              <div key={step.number} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '6rem',
                  fontWeight: 300,
                  color: '#C9A6A6',
                  marginBottom: '1rem',
                  lineHeight: 1
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.4rem',
                  fontWeight: 500,
                  color: '#F5E8E8',
                  marginBottom: '1rem',
                  lineHeight: 1.3
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.75,
                  color: '#E8C9C9'
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 500,
            color: '#D4B5B5',
            marginTop: '3rem',
            paddingBottom: '1rem'
          }}>
            Simple for your team. Memorable for your couples.
          </p>
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
