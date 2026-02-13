'use client'

import { useEffect } from 'react'

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
}

export default function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
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

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
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
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Event Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Event Type</p>
                <p className="text-base text-gray-900 capitalize">{event.event_type}</p>
              </div>
              
              {event.venue_location && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-base text-gray-900">{event.venue_location}</p>
                </div>
              )}

              {event.expected_guest_count && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expected Guests</p>
                  <p className="text-base text-gray-900">{event.expected_guest_count}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
            <div className="space-y-4">
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
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Messages</h3>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-4xl font-bold text-green-700 mb-2">
                {event.messages_count}
              </p>
              <p className="text-sm text-gray-600">Voice Messages Collected</p>
            </div>
          </div>

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
                    <p className="text-sm text-gray-600 mb-1">Internal Notes</p>
                    <p className="text-base text-gray-900">{event.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-md font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <a
            href={'/venue/events/' + event.id}
            className="px-6 py-3 rounded-md font-semibold bg-green-700 text-white hover:bg-green-800"
          >
            View Full Details
          </a>
        </div>
      </div>
    </div>
  )
}
