import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateMessageShareURL } from '@/lib/message-share'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

async function resolveTargetUserId(user: any, viewAs: string | null): Promise<string> {
  if (!viewAs) return user.id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role === 'developer') return viewAs
  return user.id
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, viewAs } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 })
    }

    const targetUserId = await resolveTargetUserId(user, viewAs || null)

    // Verify the message belongs to this user's event
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id, event_id')
      .eq('id', messageId)
      .eq('is_deleted', false)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check event ownership
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', message.event_id)
      .eq('customer_user_id', targetUserId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Not authorized to share this message' }, { status: 403 })
    }

    // Generate signed share URL (7 day expiry)
    const baseUrl = request.headers.get('origin')
      || `https://${request.headers.get('host')}`
      || process.env.NEXT_PUBLIC_SITE_URL
      || 'https://weddingringring.com'

    const shareUrl = await generateMessageShareURL(messageId, baseUrl, 7)

    return NextResponse.json({ shareUrl })
  } catch (error) {
    console.error('Message share link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
