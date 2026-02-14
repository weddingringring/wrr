import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { purchaseTwilioNumber } from '@/lib/purchase-twilio-number'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Manual phone number purchase for a specific event.
 * Can be called by:
 *  - Admin users (authenticated via session)
 *  - Cron jobs (authenticated via Bearer CRON_SECRET)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Check if request is from cron (using Bearer token)
    const authHeader = request.headers.get('authorization')
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`

    if (!isCronRequest) {
      // User request – check authentication and admin role
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }

    // Get venue country code for this event
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, venues!inner(country_code)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const venue = event.venues as any
    const countryCode = venue?.country_code || 'GB'

    // Use the shared purchase utility
    const result = await purchaseTwilioNumber(eventId, countryCode)

    if (!result.success) {
      const status = result.error?.includes('already has a phone number') ? 400 : 500
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({
      success: true,
      phone_number: result.phoneNumber,
      phone_sid: result.phoneSid,
      country_code: countryCode
    })

  } catch (error: any) {
    console.error('Error purchasing phone number:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to purchase phone number' },
      { status: 500 }
    )
  }
}
