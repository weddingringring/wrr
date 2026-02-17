import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/events/[id]/regenerate-greeting
 * Regenerates the AI greeting for an existing event.
 * Useful for events created before ElevenLabs was integrated.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params

  try {
    // Get event + venue country
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, greeting_text, venue_id')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.greeting_text) {
      return NextResponse.json({ error: 'No greeting text to generate from' }, { status: 400 })
    }

    const { data: venue } = await supabaseAdmin
      .from('venues')
      .select('country_code')
      .eq('id', event.venue_id)
      .single()

    const countryCode = venue?.country_code || 'GB'

    const { generateAiGreeting } = await import('@/lib/elevenlabs')
    const result = await generateAiGreeting(eventId, event.greeting_text, countryCode)

    if ('url' in result) {
      return NextResponse.json({ success: true, url: result.url })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Regenerate greeting error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
