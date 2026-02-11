'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    venueName: '',
    email: '',
    phone: '',
    message: '',
    interest: 'venue' // venue, couple, other
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
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="WeddingRingRing"
                width={200}
                height={67}
                priority
              />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-charcoal hover:text-deep-green transition">
                How It Works
              </a>
              <a href="#benefits" className="text-charcoal hover:text-deep-green transition">
                Benefits
              </a>
              <a href="#testimonials" className="text-charcoal hover:text-deep-green transition">
                Reviews
              </a>
              <a href="#contact" className="bg-deep-green text-white px-6 py-2 rounded-lg hover:bg-sage-dark transition font-medium">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream to-sage-light py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-deep-green leading-tight">
                Capture Audio Messages from Every Special Moment
              </h1>
              <p className="text-xl md:text-2xl text-charcoal leading-relaxed">
                The simplest way to give your couples a unique, heartfelt keepsake. 
                <span className="font-semibold"> No tech knowledge required.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#contact" 
                  className="bg-deep-green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-sage-dark transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                >
                  Add This to Your Venue
                </a>
                <a 
                  href="#how-it-works" 
                  className="bg-white text-deep-green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-sage-light transition border-2 border-deep-green text-center"
                >
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-sage border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-rose border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-deep-green border-2 border-white"></div>
                </div>
                <p className="text-sm text-sage-dark">
                  <span className="font-semibold text-deep-green">150+ venues</span> creating magical memories
                </p>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition duration-300">
                <div className="aspect-square bg-gradient-to-br from-sage-light to-rose rounded-xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-deep-green rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <p className="font-serif text-2xl text-deep-green">
                      Pick up the phone,<br />leave a message
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
              Your Couples Want Something More Personal
            </h2>
            <p className="text-xl text-charcoal leading-relaxed">
              Written guest books gather dust. Photo booths create mess. Digital apps confuse guests.
              <span className="font-semibold text-deep-green"> Your couples deserve better.</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-xl p-8 border border-sage-light">
              <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Written Guest Books</h3>
              <p className="text-charcoal">Generic messages that all look the same. No emotion, no voice, no real connection.</p>
            </div>
            
            <div className="bg-cream rounded-xl p-8 border border-sage-light">
              <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Digital Apps</h3>
              <p className="text-charcoal">Require downloads, accounts, Wi-Fi. Half your guests won't figure it out.</p>
            </div>
            
            <div className="bg-cream rounded-xl p-8 border border-sage-light">
              <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📹</span>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Video Booths</h3>
              <p className="text-charcoal">Expensive, awkward, require staff. People hate being on camera after a few drinks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-20 bg-gradient-to-br from-deep-green to-sage-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-6">
                The Audio Guestbook Everyone Can Use
              </h2>
              <p className="text-xl leading-relaxed mb-8 text-sage-light">
                A beautiful vintage phone sits on a table. Guests pick it up, hear a personalized greeting, 
                and leave a heartfelt voice message. <span className="font-semibold text-white">That's it.</span>
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-sage-light flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg">No app downloads, no Wi-Fi, no confusion</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-sage-light flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg">Works for every guest - from 8 to 80 years old</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-sage-light flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg">Captures real emotion - laughter, tears, love</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-sage-light flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg">A keepsake they'll cherish forever</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-video bg-gradient-to-br from-cream to-sage-light rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-deep-green rounded-full flex items-center justify-center mb-4">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-charcoal font-semibold">Watch how it works</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
              So Simple, It Just Works
            </h2>
            <p className="text-xl text-charcoal">
              No technical knowledge needed. We handle everything.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-deep-green text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                1
              </div>
              <div className="bg-cream rounded-xl p-8 pt-12 border border-sage-light h-full">
                <div className="w-16 h-16 bg-sage rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="font-serif text-xl text-deep-green mb-3 text-center">You Add to Your Packages</h3>
                <p className="text-charcoal text-center">Offer WeddingRingRing as an add-on or include it in premium packages.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-deep-green text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                2
              </div>
              <div className="bg-cream rounded-xl p-8 pt-12 border border-sage-light h-full">
                <div className="w-16 h-16 bg-sage rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">📦</span>
                </div>
                <h3 className="font-serif text-xl text-deep-green mb-3 text-center">We Send the Phone</h3>
                <p className="text-charcoal text-center">Beautiful vintage phone arrives. Already set up and ready to go.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-deep-green text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                3
              </div>
              <div className="bg-cream rounded-xl p-8 pt-12 border border-sage-light h-full">
                <div className="w-16 h-16 bg-sage rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="font-serif text-xl text-deep-green mb-3 text-center">Event Day</h3>
                <p className="text-charcoal text-center">Place it on a table. Plug it in. Guests leave beautiful messages.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-deep-green text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                4
              </div>
              <div className="bg-cream rounded-xl p-8 pt-12 border border-sage-light h-full">
                <div className="w-16 h-16 bg-sage rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">💝</span>
                </div>
                <h3 className="font-serif text-xl text-deep-green mb-3 text-center">Magic Delivered</h3>
                <p className="text-charcoal text-center">Couple receives all messages digitally. Memories preserved forever.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-2xl font-serif text-deep-green mb-6">
              Total setup time for your staff: <span className="font-bold">2 minutes</span>
            </p>
            <a 
              href="#contact" 
              className="inline-block bg-deep-green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-sage-dark transition"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </section>

      {/* Benefits for Venues Section */}
      <section id="benefits" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
              Why Venues Love WeddingRingRing
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Increase Revenue</h3>
              <p className="text-charcoal">Add a premium offering that couples genuinely want. Easy upsell for premium packages.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Stand Out</h3>
              <p className="text-charcoal">Be the venue that offers something unique. A talking point that couples remember.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Zero Effort</h3>
              <p className="text-charcoal">We handle everything. You just plug it in and place it. No training, no tech support needed.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Foolproof</h3>
              <p className="text-charcoal">Nothing to break, nothing to set up. Works every single time, guaranteed.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">Happy Couples</h3>
              <p className="text-charcoal">Give them a keepsake they'll treasure. They'll thank you in their reviews.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-deep-green text-white rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-deep-green mb-3">No Complaints</h3>
              <p className="text-charcoal">Unlike photo booths or apps - never a single complaint. It just works.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Couples */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
                What Couples Get
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-deep-green mb-2">Real Emotion</h3>
                    <p className="text-charcoal">Hear the laughter, the tears, the joy in their loved ones' voices. Words on paper can't capture that.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-deep-green mb-2">Messages from Everyone</h3>
                    <p className="text-charcoal">Even shy guests leave messages. The phone makes it easy and private.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">♾️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-deep-green mb-2">Forever Keepsake</h3>
                    <p className="text-charcoal">Digital messages they can download, share, and keep forever. Play them on anniversaries.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-deep-green mb-2">Beautiful Aesthetic</h3>
                    <p className="text-charcoal">The vintage phone looks stunning in photos. Instagram-worthy without trying.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sage-light to-cream rounded-2xl p-12">
              <blockquote className="space-y-4">
                <p className="font-serif text-2xl text-deep-green leading-relaxed">
                  "We cried listening to the messages. Grandma's voice, old friends we hadn't seen in years... 
                  it's the most precious thing from our wedding day."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-deep-green rounded-full"></div>
                  <div>
                    <p className="font-semibold text-deep-green">Sarah & James</p>
                    <p className="text-sm text-sage-dark">Married at The Grand Ballroom</p>
                  </div>
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-cream to-sage-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
              Loved by Venues & Couples
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Venue Testimonial */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-deep-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-charcoal mb-4 italic">
                "Best addition to our venue in years. Couples love it, it's effortless for us, and it's become a key selling point. Can't recommend enough."
              </p>
              <p className="font-semibold text-deep-green">Emma Thompson</p>
              <p className="text-sm text-sage-dark">Riverside Manor</p>
            </div>

            {/* Couple Testimonial */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-deep-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-charcoal mb-4 italic">
                "We got 47 messages! From heartfelt to hilarious. We listen to them all the time. Worth every penny and then some."
              </p>
              <p className="font-semibold text-deep-green">Rachel & Tom</p>
              <p className="text-sm text-sage-dark">October 2024</p>
            </div>

            {/* Venue Testimonial */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-deep-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-charcoal mb-4 italic">
                "Literally plug and play. Our staff love it because there's nothing to manage. Guests love it because it's so simple. Perfect."
              </p>
              <p className="font-semibold text-deep-green">Michael Chen</p>
              <p className="text-sm text-sage-dark">Oakwood Estate</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-deep-green mb-6">
              Questions? We've Got Answers
            </h2>
          </div>

          <div className="space-y-6">
            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                Do we need any technical knowledge?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                None whatsoever. If you can plug in a lamp, you can set up WeddingRingRing. The phone arrives pre-configured. 
                Just plug it in, place it on a table, and it works. No Wi-Fi setup, no apps, nothing.
              </p>
            </details>

            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                What if guests don't know how to use it?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                It's a phone. Everyone knows how to use a phone! Pick it up, listen to the greeting, speak after the beep. 
                We've had 8-year-olds and 80-year-olds use it with zero confusion. Simpler than a photo booth by far.
              </p>
            </details>

            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                What if something goes wrong on the day?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                Honestly? Nothing goes wrong. There's no Wi-Fi to drop, no app to crash, no camera to malfunction. 
                It's just a phone line. But if anything ever did happen, we're here 24/7 to help. We've got your back.
              </p>
            </details>

            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                How do couples get their messages?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                All messages are automatically saved to their private online dashboard. They can listen, download, 
                and share them anytime. Messages stay available for 30 days after the event, giving them plenty of time.
              </p>
            </details>

            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                Can we customize the greeting?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                Yes! Couples can record their own greeting (like "Hi, this is Sarah and James - leave us a message!") 
                or use our default greeting. Either way, it's personalized with their names.
              </p>
            </details>

            <details className="bg-cream rounded-xl p-6 border border-sage-light group">
              <summary className="font-semibold text-lg text-deep-green cursor-pointer flex justify-between items-center">
                How do we add this to our venue offerings?
                <svg className="w-5 h-5 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-charcoal">
                Fill out the contact form below and we'll walk you through everything. We'll discuss how it works with your 
                venue, answer all your questions, and get you set up. Most venues are up and running within a week.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-deep-green to-sage-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">
              Let's Make Magic Together
            </h2>
            <p className="text-xl text-sage-light">
              Ready to add WeddingRingRing to your venue? Fill out the form below and we'll be in touch within 24 hours.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-deep-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-3xl text-deep-green mb-4">Thank You!</h3>
              <p className="text-xl text-charcoal">
                We've received your inquiry and will be in touch within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 md:p-12 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-charcoal mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="venueName" className="block text-sm font-semibold text-charcoal mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    id="venueName"
                    required
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                    placeholder="The Grand Ballroom"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                    placeholder="john@venue.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-charcoal mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="interest" className="block text-sm font-semibold text-charcoal mb-2">
                  I'm interested as a... *
                </label>
                <select
                  id="interest"
                  required
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                >
                  <option value="venue">Venue Owner/Manager</option>
                  <option value="couple">Engaged Couple</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-charcoal mb-2">
                  Tell us a bit more (optional)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-green text-charcoal"
                  placeholder="Any questions or special requests?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-deep-green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-sage-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Get Started Today'}
              </button>

              <p className="text-sm text-charcoal text-center">
                We'll be in touch within 24 hours. Promise.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-green text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/logo.svg"
                alt="WeddingRingRing"
                width={160}
                height={53}
                className="mb-4 brightness-0 invert"
              />
              <p className="text-sage-light">
                Capture audio messages from your special day.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sage-light">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="#contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sage-light">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Get in Touch</h4>
              <ul className="space-y-2 text-sage-light">
                <li>
                  <a href="mailto:hello@weddingringring.com" className="hover:text-white transition">
                    hello@weddingringring.com
                  </a>
                </li>
                <li>
                  <a href="tel:+442012345678" className="hover:text-white transition">
                    +44 20 1234 5678
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-sage mt-12 pt-8 text-center text-sage-light">
            <p>&copy; {new Date().getFullYear()} WeddingRingRing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
