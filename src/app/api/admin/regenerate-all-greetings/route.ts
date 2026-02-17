import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAiGreeting } from '@/lib/elevenlabs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/admin/regenerate-all-greetings
 * Generates AI greetings for all active events that don't have one yet.
 */
export async function POST(request: NextRequest) {
  try {
    // Find all active events missing an AI greeting
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, greeting_text, venue_id')
      .is('ai_greeting_audio_url', null)
      .not('greeting_text', 'is', null)
      .eq('status', 'active')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events need AI greetings', processed: 0 })
    }

    const results: { eventId: string; success: boolean; error?: string }[] = []

    for (const event of events) {
      // Get venue country
      const { data: venue } = await supabaseAdmin
        .from('venues')
        .select('country_code')
        .eq('id', event.venue_id)
        .single()

      const countryCode = venue?.country_code || 'GB'

      const result = await generateAiGreeting(event.id, event.greeting_text, countryCode)

      if ('url' in result) {
        results.push({ eventId: event.id, success: true })
      } else {
        results.push({ eventId: event.id, success: false, error: result.error })
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500))
    }

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      results
    })
  } catch (err: any) {
    console.error('Bulk regenerate error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
