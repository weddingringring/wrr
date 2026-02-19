import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 5/min, 20/hour per IP (shared with album endpoint concept)
const rateLimitMap = new Map<string, { minute: number[]; hour: number[] }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  let entry = rateLimitMap.get(ip)
  if (!entry) {
    entry = { minute: [], hour: [] }
    rateLimitMap.set(ip, entry)
  }
  entry.minute = entry.minute.filter(t => t > now - 60_000)
  entry.hour = entry.hour.filter(t => t > now - 3_600_000)
  if (entry.minute.length >= 5 || entry.hour.length >= 20) return true
  entry.minute.push(now)
  entry.hour.push(now)
  return false
}

// Clean stale entries periodically
setInterval(() => {
  const cutoff = Date.now() - 3_600_000
  Array.from(rateLimitMap.entries()).forEach(([ip, entry]) => {
    entry.hour = entry.hour.filter(t => t > cutoff)
    if (entry.hour.length === 0) rateLimitMap.delete(ip)
  })
}, 600_000)

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (isRateLimited(ip)) {
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

    // Check if code exists — only return minimal info
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('share_code', normalised)
      .single()

    if (error || !event) {
      return NextResponse.json({ valid: false, error: 'Album not found' }, { status: 404 })
    }

    // Valid — frontend can redirect to /share/CODE
    return NextResponse.json({ valid: true, code: normalised })

  } catch (error) {
    console.error('Share validate error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}
