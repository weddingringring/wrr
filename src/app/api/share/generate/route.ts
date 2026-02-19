import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getExpiryDate } from '@/lib/share-security'

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

// Helper: resolve the target user ID (supports developer impersonation via viewAs)
async function resolveTargetUserId(user: any, viewAs: string | null): Promise<string> {
  if (!viewAs) return user.id
  // Verify the authenticated user is a developer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role === 'developer') return viewAs
  return user.id
}

// GET: retrieve current share code for the authenticated user's event
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const viewAs = request.nextUrl.searchParams.get('viewAs')
    const targetUserId = await resolveTargetUserId(user, viewAs)

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('share_code, share_code_created_at')
      .eq('customer_user_id', targetUserId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.share_code) {
      return NextResponse.json({ shareCode: null, sharing: false })
    }

    // Try to get expiry info (defensive if column doesn't exist yet)
    let expiresAt: string | null = null
    try {
      const { data: expiryData } = await supabaseAdmin
        .from('events')
        .select('share_code_expires_at')
        .eq('customer_user_id', targetUserId)
        .single()
      expiresAt = expiryData?.share_code_expires_at || null
    } catch {
      // Column may not exist yet
    }

    return NextResponse.json({
      shareCode: event.share_code,
      shareCodeFormatted: `${event.share_code.slice(0, 4)} ${event.share_code.slice(4)}`,
      sharing: true,
      createdAt: event.share_code_created_at,
      expiresAt,
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
    const { action, viewAs } = body // action: 'generate' | 'revoke'

    const targetUserId = await resolveTargetUserId(user, viewAs || null)

    // Find the user's event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, share_code')
      .eq('customer_user_id', targetUserId)
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

      // Also try clearing expires_at if column exists
      try {
        await supabaseAdmin.from('events').update({ share_code_expires_at: null }).eq('id', event.id)
      } catch { /* column may not exist yet */ }

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

      // Try with expiry first, fall back without if column doesn't exist
      let updated: any = null
      let updateError: any = null

      const updatePayload: any = {
        share_code: code,
        share_code_created_at: new Date().toISOString(),
      }

      // First try with expiry column
      const result1 = await supabaseAdmin
        .from('events')
        .update({ ...updatePayload, share_code_expires_at: getExpiryDate(30) })
        .eq('id', event.id)
        .select('share_code, share_code_expires_at')
        .single()

      if (result1.error && (result1.error.message?.includes('share_code_expires_at') || result1.error.code === '42703')) {
        // Column doesn't exist — retry without it
        const result2 = await supabaseAdmin
          .from('events')
          .update(updatePayload)
          .eq('id', event.id)
          .select('share_code')
          .single()
        updated = result2.data
        updateError = result2.error
      } else {
        updated = result1.data
        updateError = result1.error
      }

      if (!updateError && updated) {
        return NextResponse.json({
          shareCode: updated.share_code,
          shareCodeFormatted: `${updated.share_code.slice(0, 4)} ${updated.share_code.slice(4)}`,
          expiresAt: updated.share_code_expires_at || null,
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
