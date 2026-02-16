import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const messageId = formData.get('messageId') as string | null

    if (!file || !messageId) {
      return NextResponse.json({ error: 'Missing file or messageId' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    // 3. Verify user owns this message (via event ownership)
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

    // 4. Upload photo using service role (bypasses storage RLS)
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${messageId}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('message-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    // 5. Get public URL and update message record
    const { data: urlData } = supabaseAdmin.storage
      .from('message-photos')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ guest_photo_url: urlData.publicUrl })
      .eq('id', messageId)

    if (updateError) {
      console.error('Message update error:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      guest_photo_url: urlData.publicUrl
    })

  } catch (error: any) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
