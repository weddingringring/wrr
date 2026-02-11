import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, logInfo } from '@/lib/error-logging'
import { sendEmailSafe } from '@/lib/email'
import DayAfterSummaryEmail from '@/emails/day-after-summary'

/**
 * Cron job: Send day-after summary to customers
 * Runs: Daily at 10:00 AM
 * Purpose: Send summary email to customers 1 day after their event
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Calculate yesterday's date range (1 day ago)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date(yesterday)
    today.setDate(today.getDate() + 1)

    // Find events that happened yesterday
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        customer:customers(id, first_name, last_name, email)
      `)
      .gte('event_date', yesterday.toISOString())
      .lt('event_date', today.toISOString())
      .not('twilio_phone_number', 'is', null)

    if (error) {
      await logError('cron:send-day-after-summary', error, { 
        message: 'Failed to fetch events for day-after summary'
      }, 'critical')
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: error.message 
      }, { status: 500 })
    }

    if (!events || events.length === 0) {
      await logInfo('cron:send-day-after-summary', 'No events found from yesterday', {
        yesterday: yesterday.toISOString()
      })
      return NextResponse.json({ 
        success: true,
        message: 'No events found from yesterday',
        count: 0
      })
    }

    // Send summary email to each customer
    const results = await Promise.allSettled(
      events.map(async (event) => {
        if (!event.customer?.email) {
          throw new Error(`No email for customer: ${event.customer?.first_name || 'Unknown'}`)
        }

        // Count messages for this event
        const { count: messageCount, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)

        if (countError) {
          throw new Error(`Failed to count messages: ${countError.message}`)
        }

        // Calculate number expiry date (event date + 37 days)
        const expiryDate = new Date(event.event_date)
        expiryDate.setDate(expiryDate.getDate() + 37)

        const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`

        await sendEmailSafe({
          to: event.customer.email,
          subject: `${messageCount || 0} Messages from Your ${event.event_type}! 🎉`,
          react: DayAfterSummaryEmail({
            customerFirstName: event.customer.first_name,
            partner1FirstName: event.partner_1_first_name,
            partner1LastName: event.partner_1_last_name,
            partner2FirstName: event.partner_2_first_name || undefined,
            partner2LastName: event.partner_2_last_name || undefined,
            eventType: event.event_type,
            eventDate: event.event_date,
            phoneNumber: event.twilio_phone_number!,
            messageCount: messageCount || 0,
            dashboardUrl,
            numberExpiryDate: expiryDate.toISOString(),
          }),
        })

        return { 
          eventId: event.id, 
          customerEmail: event.customer.email,
          messageCount: messageCount || 0
        }
      })
    )

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled')
    const failures = results.filter(r => r.status === 'rejected')

    // Log failures
    if (failures.length > 0) {
      await logError('cron:send-day-after-summary', new Error('Some summaries failed to send'), {
        totalEvents: events.length,
        successCount: successes.length,
        failureCount: failures.length,
        failures: failures.map((f: any) => f.reason?.message || 'Unknown error')
      }, 'error')
    }

    // Log summary
    await logInfo('cron:send-day-after-summary', 'Day-after summaries sent', {
      totalEvents: events.length,
      successCount: successes.length,
      failureCount: failures.length,
      yesterday: yesterday.toISOString(),
      totalMessages: successes.reduce((sum: number, r: any) => 
        sum + (r.value?.messageCount || 0), 0
      )
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${successes.length} summary emails`,
      totalEvents: events.length,
      successCount: successes.length,
      failureCount: failures.length
    })

  } catch (error: any) {
    await logError('cron:send-day-after-summary', error, {
      message: 'Unexpected error in send-day-after-summary cron'
    }, 'critical')

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
