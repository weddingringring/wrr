import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    
    // Create Supabase client with user's session
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const updates = await request.json()
    
    // Verify user owns this message's event
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('event_id, events!inner(customer_user_id)')
      .eq('id', messageId)
      .single()
    
    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    
    // @ts-ignore - Supabase types
    if (message.events.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Allowed fields to update
    const allowedFields = [
      'guest_name',
      'notes',
      'tags',
      'is_favorite',
      'guest_photo_url'
    ]
    
    // Filter to only allowed fields
    const sanitizedUpdates: any = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field]
      }
    }
    
    // Always update updated_at
    sanitizedUpdates.updated_at = new Date().toISOString()
    
    // Update message
    const { data, error } = await supabase
      .from('messages')
      .update(sanitizedUpdates)
      .eq('id', messageId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, message: data })
    
  } catch (error) {
    console.error('Error in message update:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    
    // Create Supabase client with user's session
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get message details and verify ownership
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('audio_url, guest_photo_url, event_id, events!inner(customer_user_id)')
      .eq('id', messageId)
      .single()
    
    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    
    // @ts-ignore - Supabase types
    if (message.events.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Need service role for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Delete audio file from storage if exists
    if (message.audio_url) {
      // Extract file path from URL
      const urlParts = message.audio_url.split('/message-recordings/')
      if (urlParts[1]) {
        await supabaseAdmin.storage
          .from('message-recordings')
          .remove([urlParts[1]])
      }
    }
    
    // Delete guest photo from storage if exists
    if (message.guest_photo_url) {
      const urlParts = message.guest_photo_url.split('/message-photos/')
      if (urlParts[1]) {
        await supabaseAdmin.storage
          .from('message-photos')
          .remove([urlParts[1]])
      }
    }
    
    // Delete message from database
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    
    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in message delete:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
