'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    venueName: '',
    email: '',
    phone: '',
    message: '',
    interest: 'venue'
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
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
          setSubmitted(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
              WeddingRingRing
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition">
                How It Works
              </a>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition">
                Log In
              </Link>
              <button 
                onClick={() => setModalOpen(true)}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Get Started
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-4">
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700"
            >
              How It Works
            </a>
            <Link 
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700"
            >
              Log In
            </Link>
            <button 
              onClick={() => { setModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-lg"
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl mb-6 text-gray-900"
              style={{ fontFamily: 'Playfair Display, serif', lineHeight: '1.1' }}
            >
              The Audio Guestbook For Venues.
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Memories to listen back to for a lifetime
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
            >
              Find Out More
            </button>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl mb-8"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            What We Do.
          </h2>
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
            <p>
              We are the audio guestbook where timeless elegance meets modern convenience. Our vintage-style phones, combined with our modern software, creates an unforgettable audio guestbook experience.
            </p>
            <p>
              With a swift 30-second setup on our user-friendly online system, venues can effortlessly enhance their offerings and attract couples seeking that extra touch of charm.
            </p>
            <p>
              Elevate your venue, captivate your clients, and ensure every celebration is a resounding success with WeddingRingRing.
            </p>
            <a 
              href="#how-it-works"
              className="inline-block mt-4 px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition"
            >
              Find Out How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Why You Need An Audio Guestbook */}
      <section className="py-20 bg-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Why You Need An Audio Guestbook.
            </h2>
            <p className="text-xl text-gray-600">What does it add to your business?</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div key={idx} className="bg-white rounded-xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-semibold mb-4">Want to know more?</h3>
            <p className="text-xl text-gray-600 mb-6">
              Get in touch to find out how we can help you host your own audio guestbook
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
            >
              Get In Touch
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              The No-Fuss Audio Guestbook
            </h2>
            <p className="text-xl text-gray-300">It only takes a minute!</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-white text-gray-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/faqs">FAQs</Link></li>
                <li><Link href="/help">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
            © {new Date().getFullYear()} WeddingRingRing. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
                Get In Touch
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
                <p className="text-gray-600">We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Venue Name</label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
