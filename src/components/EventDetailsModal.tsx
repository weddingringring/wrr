'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
}

export default function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const partner1Name = event.partner_1_first_name + ' ' + event.partner_1_last_name
  const partner2Name = event.partner_2_first_name && event.partner_2_last_name
    ? event.partner_2_first_name + ' ' + event.partner_2_last_name
    : null

  const getDisplayName = () => {
    if (event.event_type === 'wedding') {
      return partner2Name 
        ? partner1Name + ' & ' + partner2Name + "'s Wedding"
        : partner1Name + "'s Wedding"
    }
    return partner1Name + "'s " + event.event_type
  }

  const copyPhoneNumber = () => {
    if (event.twilio_phone_number) {
      navigator.clipboard.writeText(event.twilio_phone_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getDaysUntil = () => {
    return Math.ceil(
      (new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const daysUntil = getDaysUntil()

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-8 pb-4 z-10">
          <h2 className="font-serif text-3xl mb-2 text-gray-900">
            {getDisplayName()}
          </h2>
          <p className="text-gray-600">
            {new Date(event.event_date).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-8">
          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Primary Contact</p>
                <p className="text-base text-gray-900">{partner1Name}</p>
              </div>

              {partner2Name && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Partner</p>
                  <p className="text-base text-gray-900">{partner2Name}</p>
                </div>
              )}

              {event.customer_email && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-base text-gray-900">
                    <a href={'mailto:' + event.customer_email} className="text-green-700 hover:text-green-800">
                      {event.customer_email}
                    </a>
                  </p>
                </div>
              )}

              {event.customer_phone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-base text-gray-900">
                    <a href={'tel:' + event.customer_phone} className="text-green-700 hover:text-green-800">
                      {event.customer_phone}
                    </a>
                  </p>
                </div>
              )}

              {event.expected_guest_count && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expected Guests</p>
                  <p className="text-base text-gray-900">{event.expected_guest_count} guests</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Event Type</p>
                <p className="text-base text-gray-900 capitalize">{event.event_type}</p>
              </div>
            </div>
          </div>

          {/* Phone Programming Instructions */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unique Event Phone Number</p>
                <p className="text-2xl font-mono font-bold text-green-700">
                  {event.twilio_phone_number || 'Number not assigned yet'}
                </p>
              </div>
              {event.twilio_phone_number && (
                <button
                  onClick={copyPhoneNumber}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>
            
            {event.twilio_phone_number && (
              <>
                <div className="mb-4">
                  <Link
                    href={'/venue/events/' + event.id + '/setup'}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Event Day Setup Instructions
                  </Link>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <p className="text-sm font-medium text-gray-900 mb-3">📱 Quick Setup (No screen required):</p>
                  <ol className="space-y-2 text-sm text-gray-900">
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold mr-3 flex-shrink-0">1</span>
                      <span>Turn on phone: Slide switch from <strong>0</strong> to <strong>I</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold mr-3 flex-shrink-0">2</span>
                      <span>Pick up handset, wait for dial tone, then dial: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-green-700">*02#1#{event.twilio_phone_number}*</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold mr-3 flex-shrink-0">3</span>
                      <span><strong>Phone rings once</strong> = Success! Number is saved</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold mr-3 flex-shrink-0">4</span>
                      <span><strong>Test:</strong> Pick up handset, dial <strong className="font-mono">*1</strong> - you should hear the greeting</span>
                    </li>
                  </ol>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      💡 <strong>For guests:</strong> They simply pick up and press <strong>1</strong> to leave a message (up to 4 minutes).
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <p className="text-sm text-gray-900">
                    💡 <strong>Tip:</strong> Remote guests can also call <span className="font-mono text-green-700">{event.twilio_phone_number}</span> directly from their own phones to leave messages!
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {daysUntil >= 0 && event.status === 'active' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Days Until Event</p>
                <p className="text-3xl font-bold text-green-700">{daysUntil}</p>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Messages Received</p>
              <p className="text-3xl font-bold text-gray-900">{event.messages_count}</p>
              <p className="text-xs text-gray-500 mt-1">Updates in real-time</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Greeting Status</p>
              <p className="text-lg font-medium text-green-700 mt-2">
                {event.greeting_audio_url ? '✓ Uploaded' : '⏳ Pending'}
              </p>
            </div>
          </div>

          {/* Additional Information */}
          {(event.age || event.years_together || event.company_name || event.special_requirements || event.notes) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h3>
              <div className="space-y-4">
                {event.age && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Age</p>
                    <p className="text-base text-gray-900">{event.age}</p>
                  </div>
                )}

                {event.years_together && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Years Together</p>
                    <p className="text-base text-gray-900">{event.years_together}</p>
                  </div>
                )}

                {event.company_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Company</p>
                    <p className="text-base text-gray-900">{event.company_name}</p>
                  </div>
                )}

                {event.special_requirements && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Special Requirements</p>
                    <p className="text-base text-gray-900">{event.special_requirements}</p>
                  </div>
                )}

                {event.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-base text-gray-900 whitespace-pre-wrap">{event.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> You can view the event details and message count, but only customers can listen to their messages. 
              They access their dashboard at weddingringring.com with their email and password.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-md font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <Link
            href={'/venue/events/' + event.id}
            onClick={onClose}
            className="px-6 py-3 rounded-md font-semibold bg-green-700 text-white hover:bg-green-800"
          >
            View Full Details & Edit
          </Link>
        </div>
      </div>
    </div>
  )
}
