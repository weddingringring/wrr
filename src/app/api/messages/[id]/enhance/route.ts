import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enhanceRecording } from '@/lib/elevenlabs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/messages/[id]/enhance
 * Runs Voice Isolator on a message recording.
 * Can be called from the recording webhook (async) or manually.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: messageId } = await params

  try {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .select('id, recording_url, event_id, enhanced_recording_url')
      .eq('id', messageId)
      .single()

    if (error || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (!message.recording_url) {
      return NextResponse.json({ error: 'No recording to enhance' }, { status: 400 })
    }

    // Skip if already enhanced
    if (message.enhanced_recording_url) {
      return NextResponse.json({ message: 'Already enhanced', url: message.enhanced_recording_url })
    }

    const result = await enhanceRecording(messageId, message.recording_url, message.event_id)

    if ('url' in result) {
      return NextResponse.json({ success: true, url: result.url })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Enhance recording error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
