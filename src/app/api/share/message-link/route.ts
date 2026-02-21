import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Edge-compatible HMAC verification (no supabase-js or Node crypto needed)
const SHARE_SECRET = process.env.MESSAGE_SHARE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'wrr-msg-share-fallback'

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SHARE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const bytes = new Uint8Array(sig)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifyToken(messageId: string, e: string, s: string): Promise<boolean> {
  const expires = parseInt(e, 10)
  if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) return false
  const expected = await hmacSign(`${messageId}:${expires}`)
  return s === expected
}

// Raw fetch to Supabase REST API (edge-compatible, no supabase-js)
async function supabaseQuery(table: string, query: string): Promise<any> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/vnd.pgrst.object+json',
    },
  })
  if (!res.ok) return null
  return res.json()
}

async function getSignedPhotoUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null
  let filePath = storagePath
  const bucket = 'message-photos'
  if (storagePath.includes(`/storage/v1/object/public/${bucket}/`)) {
    filePath = storagePath.split(`/storage/v1/object/public/${bucket}/`)[1]
  }
  if (!filePath) return null
  filePath = decodeURIComponent(filePath)

  const res = await fetch(`${supabaseUrl}/storage/v1/object/sign/${bucket}/${filePath}`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 120 }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.signedURL ? `${supabaseUrl}/storage/v1${data.signedURL}` : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const messageId = searchParams.get('id')
  const e = searchParams.get('e')
  const s = searchParams.get('s')

  if (!messageId || !e || !s) {
    return fallbackImage('Audio Guestbook Message')
  }

  // Verify token
  const valid = await verifyToken(messageId, e, s)
  if (!valid) {
    return fallbackImage('Audio Guestbook Message')
  }

  try {
    // Fetch message
    const message = await supabaseQuery(
      'messages',
      `id=eq.${messageId}&is_deleted=eq.false&select=caller_name,guest_photo_url,event_id`
    )

    if (!message) return fallbackImage('Audio Guestbook Message')

    // Fetch event
    const event = await supabaseQuery(
      'events',
      `id=eq.${message.event_id}&select=partner_1_first_name,partner_2_first_name,event_type,event_date`
    )

    const callerName = message.caller_name || 'A guest'
    const couple = event
      ? (event.partner_1_first_name && event.partner_2_first_name
        ? `${event.partner_1_first_name} & ${event.partner_2_first_name}`
        : event.partner_1_first_name || '')
      : ''
    const eventType = formatEventType(event?.event_type)
    const eventDate = event?.event_date
      ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''

    // Try to get guest photo
    let photoUrl: string | null = null
    if (message.guest_photo_url) {
      photoUrl = await getSignedPhotoUrl(message.guest_photo_url)
    }

    // Build image response first, then override default cache headers
    // (ImageResponse defaults to immutable/31536000 which can't be overridden via options)
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%)',
            padding: '60px',
            fontFamily: 'Georgia, serif',
          }}
        >
          {/* Left: Photo or waveform icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              width: '380px',
              height: '380px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.06)',
              border: '1px solid rgba(180, 165, 140, 0.2)',
              padding: photoUrl ? '8px' : '0',
            }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                width={364}
                height={364}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  background: '#f5f0e8',
                }}
              >
                {/* Audio waveform visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                  {[40, 65, 30, 80, 50, 70, 35, 60, 45, 75, 55, 40, 68].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: `${h}px`,
                        borderRadius: '4px',
                        background: `rgba(88, 126, 106, ${0.3 + (h / 120)})`,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#a69d8e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: 'sans-serif',
                  }}
                >
                  Voice message
                </div>
              </div>
            )}
          </div>

          {/* Right: Text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginLeft: '60px',
              flex: 1,
            }}
          >
            {/* "A message from" */}
            <div
              style={{
                fontSize: '16px',
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#a69d8e',
                marginBottom: '16px',
              }}
            >
              A message from
            </div>

            {/* Caller name */}
            <div
              style={{
                fontSize: '52px',
                fontWeight: 400,
                color: '#2c2418',
                lineHeight: 1.2,
                marginBottom: '24px',
              }}
            >
              {callerName}
            </div>

            {/* Divider */}
            <div
              style={{
                width: '60px',
                height: '2px',
                background: 'rgba(180, 165, 140, 0.3)',
                marginBottom: '24px',
              }}
            />

            {/* Couple + event */}
            {couple && (
              <div
                style={{
                  fontSize: '22px',
                  color: '#6a5f4f',
                  lineHeight: 1.4,
                  marginBottom: '8px',
                }}
              >
                {couple}&rsquo;s {eventType}
              </div>
            )}

            {/* Date */}
            {eventDate && (
              <div
                style={{
                  fontSize: '16px',
                  color: '#a69d8e',
                }}
              >
                {eventDate}
              </div>
            )}

            {/* WRR branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '40px',
                fontSize: '13px',
                fontFamily: 'sans-serif',
                color: 'rgba(0,0,0,0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              weddingringring.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )

    // Override default immutable cache with short TTL for WhatsApp freshness
    imageResponse.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
    imageResponse.headers.set('Access-Control-Allow-Origin', '*')

    return imageResponse
  } catch (error) {
    console.error('OG image error:', error)
    return fallbackImage('Audio Guestbook Message')
  }
}

function formatEventType(type: string | null | undefined): string {
  if (!type) return 'celebration'
  const t = type.toLowerCase()
  if (t.includes('wedding')) return 'wedding'
  if (t.includes('birthday')) return 'birthday'
  if (t.includes('anniversary')) return 'anniversary'
  if (t.includes('engagement')) return 'engagement'
  return 'celebration'
}

function fallbackImage(title: string) {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%)',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          {[40, 65, 30, 80, 50, 70, 35, 60, 45].map((h, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: `${h}px`,
                borderRadius: '5px',
                background: `rgba(88, 126, 106, ${0.3 + (h / 120)})`,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '36px', color: '#2c2418', marginBottom: '12px' }}>{title}</div>
        <div style={{ fontSize: '16px', color: '#a69d8e', fontFamily: 'sans-serif' }}>weddingringring.com</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )

  // Override default immutable cache
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
  response.headers.set('Access-Control-Allow-Origin', '*')

  return response
}
