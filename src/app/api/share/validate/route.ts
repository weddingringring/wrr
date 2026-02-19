import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, extractIP, logAccess, isCodeExpired } from '@/lib/share-security'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const ip = extractIP(request)

    const allowed = await checkRateLimit(ip, 'validate', 5, 20)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a moment.' },
        { status: 429 }
      )
    }

    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Missing code' }, { status: 400 })
    }

    // Strip spaces and normalise
    const normalised = code.replace(/\s/g, '').toUpperCase()

    if (!/^[A-Z0-9]{8}$/.test(normalised)) {
      return NextResponse.json({ valid: false, error: 'Invalid code format' }, { status: 400 })
    }

    // Check if code exists — return event details for personalised welcome
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, partner_1_first_name, partner_2_first_name, event_type')
      .eq('share_code', normalised)
      .single()

    if (error || !event) {
      await logAccess(null, ip, 'validate', false)
      return NextResponse.json({ valid: false, error: 'Album not found' }, { status: 404 })
    }

    // Check expiry (separate query — defensive if column doesn't exist yet)
    try {
      const { data: expiryData } = await supabaseAdmin
        .from('events')
        .select('share_code_expires_at')
        .eq('id', event.id)
        .single()
      if (expiryData?.share_code_expires_at && isCodeExpired(expiryData.share_code_expires_at)) {
        await logAccess(event.id, ip, 'validate', false)
        return NextResponse.json({ valid: false, error: 'This access key has expired.' }, { status: 410 })
      }
    } catch {
      // Column may not exist yet — skip expiry check
    }

    // Valid — log success and return
    await logAccess(event.id, ip, 'validate', true)

    return NextResponse.json({
      valid: true,
      code: normalised,
      partner1FirstName: event.partner_1_first_name || null,
      partner2FirstName: event.partner_2_first_name || null,
      eventType: event.event_type || null,
    })

  } catch (error) {
    console.error('Share validate error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}
