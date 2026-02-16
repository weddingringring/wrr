import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('greeting') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload an audio file.' 
      }, { status: 400 })
    }
    
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }
    
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, customer_user_id, greeting_audio_url')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    if (event.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
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
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('event-greetings')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
    
    const { data: urlData } = supabaseAdmin.storage
      .from('event-greetings')
      .getPublicUrl(fileName)
    
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        greeting_audio_url: urlData.publicUrl,
        greeting_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      greeting_url: urlData.publicUrl 
    })
    
  } catch (error) {
    console.error('Error in greeting upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, customer_user_id, greeting_audio_url')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    if (event.customer_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    if (event.greeting_audio_url) {
      const urlParts = event.greeting_audio_url.split('/event-greetings/')
      if (urlParts[1]) {
        await supabaseAdmin.storage
          .from('event-greetings')
          .remove([urlParts[1]])
      }
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        greeting_audio_url: null,
        greeting_uploaded_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting greeting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
