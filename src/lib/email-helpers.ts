import { sendEmailSafe } from './email'
import CustomerWelcomeEmail from '@/emails/customer-welcome'
import PhoneAssignedEmail from '@/emails/phone-assigned'
import VenueNotificationEmail from '@/emails/venue-notification'
import VenuePhoneReadyEmail from '@/emails/venue-phone-ready'

interface EventData {
  id: string
  partner_1_first_name: string
  partner_1_last_name: string
  partner_2_first_name?: string | null
  partner_2_last_name?: string | null
  event_type: string
  event_date: string
  greeting_text: string
  twilio_phone_number?: string | null
  customer?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  venue?: {
    id: string
    name: string
    email: string
  }
}

/**
 * Send welcome email to customer when event is created
 */
export async function sendCustomerWelcomeEmail(
  event: EventData,
  temporaryPassword: string
) {
  if (!event.customer?.email) {
    throw new Error('Customer email not found')
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/login`

  return await sendEmailSafe({
    to: event.customer.email,
    subject: `Welcome to WeddingRingRing - Your ${event.event_type} is Ready!`,
    react: CustomerWelcomeEmail({
      customerFirstName: event.customer.first_name, // CHANGED: First name only
      partner1FirstName: event.partner_1_first_name,
      partner1LastName: event.partner_1_last_name,
      partner2FirstName: event.partner_2_first_name || undefined,
      partner2LastName: event.partner_2_last_name || undefined,
      eventType: event.event_type,
      eventDate: event.event_date,
      venueName: event.venue?.name || 'TBD',
      customerEmail: event.customer.email,
      temporaryPassword,
      dashboardUrl,
    }),
  })
}

/**
 * Send event notification to venue when event is created
 */
export async function sendVenueEventNotification(event: EventData) {
  if (!event.venue?.email) {
    throw new Error('Venue email not found')
  }

  const eventDetailsUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/venue/events/${event.id}`

  return await sendEmailSafe({
    to: event.venue.email,
    subject: `Event Created - ${event.partner_1_first_name} ${event.partner_1_last_name}'s ${event.event_type}`,
    react: VenueNotificationEmail({
      venueName: event.venue.name,
      partner1FirstName: event.partner_1_first_name,
      partner1LastName: event.partner_1_last_name,
      partner2FirstName: event.partner_2_first_name || undefined,
      partner2LastName: event.partner_2_last_name || undefined,
      eventType: event.event_type,
      eventDate: event.event_date,
      customerEmail: event.customer?.email || 'N/A',
      eventDetailsUrl,
    }),
  })
}

/**
 * Send phone assigned email to customer (30 days before event)
 */
export async function sendCustomerPhoneAssigned(event: EventData) {
  if (!event.customer?.email) {
    throw new Error('Customer email not found')
  }

  if (!event.twilio_phone_number) {
    throw new Error('Phone number not assigned')
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/login`

  return await sendEmailSafe({
    to: event.customer.email,
    subject: 'Your WeddingRingRing Audio Guestbook is Ready!',
    react: PhoneAssignedEmail({
      customerFirstName: event.customer.first_name, // CHANGED: First name only
      partner1FirstName: event.partner_1_first_name,
      partner1LastName: event.partner_1_last_name,
      partner2FirstName: event.partner_2_first_name || undefined,
      partner2LastName: event.partner_2_last_name || undefined,
      eventType: event.event_type,
      eventDate: event.event_date,
      phoneNumber: event.twilio_phone_number,
      dashboardUrl,
    }),
  })
}

/**
 * Send phone ready email to venue (30 days before event)
 */
export async function sendVenuePhoneReady(event: EventData) {
  if (!event.venue?.email) {
    throw new Error('Venue email not found')
  }

  if (!event.twilio_phone_number) {
    throw new Error('Phone number not assigned')
  }

  const setupUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/venue/events/${event.id}/setup`

  return await sendEmailSafe({
    to: event.venue.email,
    subject: `Phone Number Ready - Setup Required for ${new Date(event.event_date).toLocaleDateString('en-GB')}`,
    react: VenuePhoneReadyEmail({
      venueName: event.venue.name,
      partner1FirstName: event.partner_1_first_name,
      partner1LastName: event.partner_1_last_name,
      partner2FirstName: event.partner_2_first_name || undefined,
      partner2LastName: event.partner_2_last_name || undefined,
      eventType: event.event_type,
      eventDate: event.event_date,
      phoneNumber: event.twilio_phone_number,
      setupUrl,
      greetingText: event.greeting_text,
    }),
  })
}
