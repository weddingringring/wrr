import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Simple in-memory rate limiter ──
// 5 requests per minute per IP, 20 per hour
const rateLimitMap = new Map<string, { minute: number[]; hour: number[] }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  const oneHourAgo = now - 3_600_000

  let entry = rateLimitMap.get(ip)
  if (!entry) {
    entry = { minute: [], hour: [] }
    rateLimitMap.set(ip, entry)
  }

  // Clean old entries
  entry.minute = entry.minute.filter(t => t > oneMinuteAgo)
  entry.hour = entry.hour.filter(t => t > oneHourAgo)

  if (entry.minute.length >= 5 || entry.hour.length >= 20) {
    return true
  }

  entry.minute.push(now)
  entry.hour.push(now)
  return false
}

// Clean stale entries every 10 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 3_600_000
  Array.from(rateLimitMap.entries()).forEach(([ip, entry]) => {
    entry.hour = entry.hour.filter(t => t > oneHourAgo)
    if (entry.hour.length === 0) rateLimitMap.delete(ip)
  })
}, 600_000)

// ── Helper: generate signed URL for a storage path ──
async function getSignedUrl(storagePath: string, bucket: string = 'message-recordings'): Promise<string | null> {
  if (!storagePath) return null

  // If it's already a full URL, extract the path
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
    .createSignedUrl(filePath, 15 * 60) // 15 minutes for shared access

  if (error) {
    console.error(`Signed URL error (${bucket}):`, error)
    return null
  }

  return data.signedUrl
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { code } = params

    // Validate code format: 8 alphanumeric chars
    if (!code || !/^[A-Z0-9]{8}$/i.test(code)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    // Normalise to uppercase
    const shareCode = code.toUpperCase()

    // Look up event by share code
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        event_type,
        event_date,
        partner_1_first_name,
        partner_2_first_name,
        greeting_audio_url,
        ai_greeting_audio_url,
        venue_id
      `)
      .eq('share_code', shareCode)
      .single()

    if (eventError || !event) {
      // Deliberately vague — don't reveal whether the code was close or not
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Fetch venue info for branding
    let venueInfo: { name: string; logoUrl: string | null } | null = null
    if (event.venue_id) {
      const { data: venue } = await supabaseAdmin
        .from('venues')
        .select('name, logo_url')
        .eq('id', event.venue_id)
        .single()
      if (venue) {
        venueInfo = { name: venue.name, logoUrl: venue.logo_url }
      }
    }

    // Fetch shared, non-deleted messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        caller_name,
        duration,
        recording_url,
        enhanced_recording_url,
        guest_photo_url,
        tags,
        is_favorite,
        is_favorited,
        recorded_at,
        created_at
      `)
      .eq('event_id', event.id)
      .eq('is_deleted', false)
      .eq('is_shared', true)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error loading shared messages:', msgError)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    // Generate signed URLs for all audio + photos in parallel
    const messagePromises = (messages || []).map(async (msg) => {
      const audioPath = msg.enhanced_recording_url || msg.recording_url
      const [audioUrl, photoUrl] = await Promise.all([
        getSignedUrl(audioPath, 'message-recordings'),
        msg.guest_photo_url ? getSignedUrl(msg.guest_photo_url, 'message-photos') : null
      ])

      return {
        id: msg.id,
        callerName: msg.caller_name,
        duration: msg.duration,
        audioUrl,
        photoUrl,
        tags: msg.tags,
        isFavorited: msg.is_favorite || msg.is_favorited,
        recordedAt: msg.recorded_at || msg.created_at
      }
    })

    const resolvedMessages = await Promise.all(messagePromises)

    // Signed URL for greeting audio (stored in event-greetings bucket)
    // Note: greeting URLs may already be public (Twilio needs direct access)
    const greetingPath = event.greeting_audio_url || event.ai_greeting_audio_url
    let greetingUrl: string | null = null
    if (greetingPath) {
      // Try signing it; if it fails, fall back to the raw URL (may be public)
      const signed = await getSignedUrl(greetingPath, 'event-greetings')
      greetingUrl = signed || greetingPath
    }

    return NextResponse.json({
      event: {
        eventType: event.event_type,
        eventDate: event.event_date,
        partner1FirstName: event.partner_1_first_name,
        partner2FirstName: event.partner_2_first_name,
        greetingUrl,
        hasCustomGreeting: !!event.greeting_audio_url
      },
      venue: venueInfo,
      messages: resolvedMessages,
      messageCount: resolvedMessages.length,
      // Tell client when signed URLs expire so it can auto-refresh
      signedUrlExpiresIn: 15 * 60 // seconds
    })

  } catch (error) {
    console.error('Share album error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
