import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { purchaseTwilioNumber, PURCHASE_THRESHOLD_DAYS } from '@/lib/purchase-twilio-number'
import { logError, logCritical, logInfo } from '@/lib/error-logging'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron job to purchase phone numbers for upcoming events.
 * Runs at midnight UTC via Vercel Cron (vercel.json).
 *
 * Purchases numbers for events where:
 *  - Event date is within PURCHASE_THRESHOLD_DAYS (7) days from now
 *  - No phone number assigned yet
 *  - Event is not cancelled
 *
 * This acts as both the primary trigger (for events created > 7 days out)
 * and a safety net (catches any events where immediate purchase failed
 * or the event date was moved closer).
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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Calculate the cutoff date (7 days from now)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + PURCHASE_THRESHOLD_DAYS)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    console.log(`[cron:purchase] Looking for events between ${todayStr} and ${cutoffDateStr} without a number`)

    // Find ALL active events within the threshold that don't have a number yet.
    // This is deliberately broader than "exactly 7 days out" so it acts as a
    // safety net for missed purchases, date changes, or failed immediate buys.
    const { data: events, error: queryError } = await supabase
      .from('events')
      .select(`
        id,
        event_date,
        venue_id,
        venues!inner(country_code)
      `)
      .neq('status', 'cancelled')
      .is('twilio_phone_number', null)
      .gte('event_date', todayStr)
      .lte('event_date', cutoffDateStr)

    if (queryError) {
      console.error('[cron:purchase] Query error:', queryError)
      await logError('cron:purchase-numbers', queryError, { step: 'query' })
      throw queryError
    }

    if (!events || events.length === 0) {
      console.log('[cron:purchase] No events need phone numbers today')
      await logInfo('cron:purchase-numbers', 'No events needing numbers', {
        todayStr,
        cutoffDateStr
      })
      return NextResponse.json({
        success: true,
        message: 'No events need phone numbers',
        purchased: 0,
        failed: 0
      })
    }

    console.log(`[cron:purchase] Found ${events.length} event(s) needing phone numbers`)
    await logInfo('cron:purchase-numbers', `Processing ${events.length} events`, {
      todayStr,
      cutoffDateStr,
      eventCount: events.length
    })

    const results = {
      purchased: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Purchase a number for each event using the shared utility
    for (const event of events) {
      const venue = event.venues as any
      const countryCode = venue?.country_code || 'GB'

      const result = await purchaseTwilioNumber(event.id, countryCode)

      if (result.success) {
        results.purchased++
        console.log(`[cron:purchase] ✓ ${result.phoneNumber} → event ${event.id}`)
      } else {
        // "already has a number" isn't really a failure – skip it
        if (result.error?.includes('already has a phone number')) {
          console.log(`[cron:purchase] Skipped event ${event.id} (already has number)`)
          continue
        }
        results.failed++
        const errorMsg = `Event ${event.id}: ${result.error}`
        results.errors.push(errorMsg)
        console.error(`[cron:purchase] ✗ ${errorMsg}`)

        await logCritical('cron:purchase-numbers', result.error || 'Unknown error', {
          eventId: event.id,
          countryCode,
          eventDate: event.event_date,
          errorType: 'purchase_failed'
        })
      }
    }

    console.log(`[cron:purchase] Done: ${results.purchased} purchased, ${results.failed} failed`)

    if (results.failed > 0) {
      await logError('cron:purchase-numbers', 'Some purchases failed', {
        purchased: results.purchased,
        failed: results.failed,
        errors: results.errors
      }, 'warning')
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error: any) {
    console.error('[cron:purchase] Fatal error:', error)
    await logCritical('cron:purchase-numbers', error, { errorType: 'cron_failure' })
    return NextResponse.json(
      { error: error.message || 'Failed to run purchase cron' },
      { status: 500 }
    )
  }
}
