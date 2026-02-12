import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    
    // Create Supabase client with user's session (respects RLS)
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('greeting') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file type (audio only)
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload an audio file.' 
      }, { status: 400 })
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }
    
    // Get event to verify it exists and user owns it
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, customer_user_id, greeting_audio_url')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Verify ownership
    if (event.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Need service role for storage operations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Delete old greeting if exists
    if (event.greeting_audio_url) {
      const urlParts = event.greeting_audio_url.split('/event-greetings/')
      if (urlParts[1]) {
        await supabaseAdmin.storage
          .from('event-greetings')
          .remove([urlParts[1]])
      }
    }
    
    // Upload new greeting
    const fileExt = file.name.split('.').pop()
    const fileName = `${eventId}/greeting.${fileExt}`
    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('event-greetings')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 })
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('event-greetings')
      .getPublicUrl(fileName)
    
    // Update event with new greeting URL
    const { error: updateError } = await supabase
      .from('events')
      .update({
        greeting_audio_url: urlData.publicUrl,
        greeting_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update event' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      greeting_url: urlData.publicUrl 
    })
    
  } catch (error) {
    console.error('Error in greeting upload:', error)
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
    const eventId = params.id
    
    // Create Supabase client with user's session (respects RLS)
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, customer_user_id, greeting_audio_url')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Verify ownership
    if (event.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Need service role for storage operations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Delete file from storage if exists
    if (event.greeting_audio_url) {
      const urlParts = event.greeting_audio_url.split('/event-greetings/')
      if (urlParts[1]) {
        await supabaseAdmin.storage
          .from('event-greetings')
          .remove([urlParts[1]])
      }
    }
    
    // Remove greeting URL from event (revert to auto-generated)
    const { error: updateError } = await supabase
      .from('events')
      .update({
        greeting_audio_url: null,
        greeting_uploaded_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update event' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting greeting:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
