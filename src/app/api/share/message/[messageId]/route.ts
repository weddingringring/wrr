import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyMessageShareToken } from '@/lib/message-share'
import { checkRateLimit, extractIP } from '@/lib/share-security'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSignedUrl(storagePath: string, bucket: string): Promise<string | null> {
  if (!storagePath) return null

  let filePath = storagePath
  if (storagePath.includes(`/storage/v1/object/public/${bucket}/`)) {
    filePath = storagePath.split(`/storage/v1/object/public/${bucket}/`)[1]
  } else if (storagePath.includes(`/storage/v1/object/sign/${bucket}/`)) {
    const pathPart = storagePath.split(`/storage/v1/object/sign/${bucket}/`)[1]
    filePath = pathPart?.split('?')[0]
  }
  if (!filePath) return null
  filePath = decodeURIComponent(filePath)

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(filePath, 15 * 60)

  if (error) {
    console.error(`Signed URL error (${bucket}):`, error)
    return null
  }
  return data.signedUrl
}

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const ip = extractIP(request)
    const allowed = await checkRateLimit(ip, 'message_share', 10, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { messageId } = params
    const e = request.nextUrl.searchParams.get('e')
    const s = request.nextUrl.searchParams.get('s')

    // Verify HMAC token
    const verification = await verifyMessageShareToken(messageId, e, s)
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid share link' },
        { status: verification.error?.includes('expired') ? 410 : 403 }
      )
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 })
    }

    // Fetch message with event + venue context
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        caller_name,
        duration,
        recording_url,
        enhanced_recording_url,
        guest_photo_url,
        recorded_at,
        created_at,
        event_id
      `)
      .eq('id', messageId)
      .eq('is_deleted', false)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Fetch event details
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('partner_1_first_name, partner_2_first_name, event_type, event_date, venue_id')
      .eq('id', message.event_id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch venue for branding + slug (for "View full album" link)
    let venue: { name: string; logoUrl: string | null; slug: string | null } | null = null
    if (event.venue_id) {
      const { data: v } = await supabaseAdmin
        .from('venues')
        .select('name, logo_url, slug')
        .eq('id', event.venue_id)
        .single()
      if (v) {
        venue = { name: v.name, logoUrl: v.logo_url, slug: v.slug || null }
      }
    }

    // Generate signed URLs
    const audioPath = message.enhanced_recording_url || message.recording_url
    const [audioUrl, photoUrl] = await Promise.all([
      getSignedUrl(audioPath, 'message-recordings'),
      message.guest_photo_url ? getSignedUrl(message.guest_photo_url, 'message-photos') : null,
    ])

    const res = NextResponse.json({
      message: {
        id: message.id,
        callerName: message.caller_name,
        duration: message.duration,
        audioUrl,
        photoUrl,
        recordedAt: message.recorded_at || message.created_at,
      },
      event: {
        partner1FirstName: event.partner_1_first_name,
        partner2FirstName: event.partner_2_first_name,
        eventType: event.event_type,
        eventDate: event.event_date,
      },
      venue,
    })

    res.headers.set('Cache-Control', 'no-store, private')
    return res
  } catch (error) {
    console.error('Message share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
