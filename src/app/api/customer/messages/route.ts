import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// PATCH - update a message (name, favorite, tags, delete, restore, photo)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, updates } = await request.json()

    if (!messageId || !updates) {
      return NextResponse.json({ error: 'Missing messageId or updates' }, { status: 400 })
    }

    // Verify message belongs to user's event
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id, event_id')
      .eq('id', messageId)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const { data: event, error: evtError } = await supabaseAdmin
      .from('events')
      .select('customer_user_id')
      .eq('id', message.event_id)
      .single()

    if (evtError || !event || event.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow specific fields to be updated
    const allowedFields = ['caller_name', 'is_favorite', 'is_deleted', 'tags', 'guest_photo_url', 'deleted_at', 'is_shared']
    const safeUpdates: Record<string, any> = {}
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = updates[key]
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update(safeUpdates)
      .eq('id', messageId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
