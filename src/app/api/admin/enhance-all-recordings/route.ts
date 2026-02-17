import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enhanceRecording } from '@/lib/elevenlabs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/admin/enhance-all-recordings
 * Runs Voice Isolator on all messages that don't have an enhanced version yet.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, recording_url, event_id')
      .is('enhanced_recording_url', null)
      .not('recording_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50) // Process in batches to avoid timeout

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No messages need enhancement', processed: 0 })
    }

    const results: { messageId: string; success: boolean; error?: string }[] = []

    for (const msg of messages) {
      const result = await enhanceRecording(msg.id, msg.recording_url, msg.event_id)

      if ('url' in result) {
        results.push({ messageId: msg.id, success: true })
      } else {
        results.push({ messageId: msg.id, success: false, error: result.error })
      }

      // Delay between requests to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000))
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
    console.error('Bulk enhance error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
