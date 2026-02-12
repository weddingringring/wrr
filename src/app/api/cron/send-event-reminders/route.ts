import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, logInfo } from '@/lib/error-logging'
import { sendEmailSafe } from '@/lib/email'
import VenueReminderEmail from '@/emails/venue-reminder'

/**
 * Cron job: Send venue event reminders
 * Runs: Daily at 8:00 AM
 * Purpose: Send reminder emails to venues 1 day before events
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Calculate tomorrow's date range (1 day from now)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Find events happening tomorrow that have phone numbers assigned
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(id, name, email)
      `)
      .gte('event_date', tomorrow.toISOString())
      .lt('event_date', dayAfterTomorrow.toISOString())
      .not('twilio_phone_number', 'is', null)

    if (error) {
      await logError('cron:send-event-reminders', error, { 
        message: 'Failed to fetch events for reminders'
      }, 'critical')
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: error.message 
      }, { status: 500 })
    }

    if (!events || events.length === 0) {
      await logInfo('cron:send-event-reminders', 'No events found for tomorrow', {
        tomorrow: tomorrow.toISOString()
      })
      return NextResponse.json({ 
        success: true,
        message: 'No events found for tomorrow',
        count: 0
      })
    }

    // Send reminder email to each venue
    const results = await Promise.allSettled(
      events.map(async (event) => {
        const venue = event.venue as any
        if (!venue?.email) {
          throw new Error(`No email for venue: ${venue?.name || 'Unknown'}`)
        }

        const setupUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/venue/events/${event.id}/setup`

        await sendEmailSafe({
          to: venue.email,
          subject: `Event Tomorrow - Setup Required for ${event.partner_1_first_name} ${event.partner_1_last_name}'s ${event.event_type}`,
          react: VenueReminderEmail({
            venueName: venue.name,
            partner1FirstName: event.partner_1_first_name,
            partner1LastName: event.partner_1_last_name,
            partner2FirstName: event.partner_2_first_name || undefined,
            partner2LastName: event.partner_2_last_name || undefined,
            eventType: event.event_type,
            eventDate: event.event_date,
            phoneNumber: event.twilio_phone_number!,
            setupUrl,
          }),
        })

        return { eventId: event.id, venueName: venue.name }
      })
    )

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled')
    const failures = results.filter(r => r.status === 'rejected')

    // Log failures
    if (failures.length > 0) {
      await logError('cron:send-event-reminders', new Error('Some reminders failed to send'), {
        totalEvents: events.length,
        successCount: successes.length,
        failureCount: failures.length,
        failures: failures.map((f: any) => f.reason?.message || 'Unknown error')
      }, 'error')
    }

    // Log summary
    await logInfo('cron:send-event-reminders', 'Event reminders sent', {
      totalEvents: events.length,
      successCount: successes.length,
      failureCount: failures.length,
      tomorrow: tomorrow.toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${successes.length} reminder emails`,
      totalEvents: events.length,
      successCount: successes.length,
      failureCount: failures.length
    })

  } catch (error: any) {
    await logError('cron:send-event-reminders', error, {
      message: 'Unexpected error in send-event-reminders cron'
    }, 'critical')

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
