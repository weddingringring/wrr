import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Safe charset: A-Z + 2-9 (no 0/O/1/I to avoid confusion)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join('')
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET: retrieve current share code for the authenticated user's event
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('share_code, share_code_created_at')
      .eq('customer_user_id', user.id)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.share_code) {
      return NextResponse.json({ shareCode: null, sharing: false })
    }

    return NextResponse.json({
      shareCode: event.share_code,
      shareCodeFormatted: `${event.share_code.slice(0, 4)} ${event.share_code.slice(4)}`,
      sharing: true,
      createdAt: event.share_code_created_at
    })
  } catch (error) {
    console.error('Share GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: generate or revoke share code
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'generate' | 'revoke'

    // Find the user's event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, share_code')
      .eq('customer_user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Revoke: set share_code to NULL
    if (action === 'revoke') {
      const { error: updateError } = await supabaseAdmin
        .from('events')
        .update({ share_code: null, share_code_created_at: null })
        .eq('id', event.id)

      if (updateError) {
        console.error('Error revoking share code:', updateError)
        return NextResponse.json({ error: 'Failed to revoke share code' }, { status: 500 })
      }

      return NextResponse.json({ shareCode: null, revoked: true })
    }

    // Generate: create new code (replaces any existing, instantly revoking old)
    let attempts = 0
    const MAX_ATTEMPTS = 5

    while (attempts < MAX_ATTEMPTS) {
      const code = generateCode()

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('events')
        .update({
          share_code: code,
          share_code_created_at: new Date().toISOString()
        })
        .eq('id', event.id)
        .select('share_code')
        .single()

      if (!updateError && updated) {
        return NextResponse.json({
          shareCode: updated.share_code,
          // Formatted for display: "A7KF 9M2X"
          shareCodeFormatted: `${updated.share_code.slice(0, 4)} ${updated.share_code.slice(4)}`
        })
      }

      // If UNIQUE constraint violation, retry with new code
      if (updateError?.code === '23505') {
        attempts++
        continue
      }

      // Other error
      console.error('Error generating share code:', updateError)
      return NextResponse.json({ error: 'Failed to generate share code' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to generate unique code, try again' }, { status: 500 })

  } catch (error) {
    console.error('Share generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
