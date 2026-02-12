import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    
    // Create Supabase client with user's session
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { reason } = await request.json()
    
    // Get event details and verify ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, messages:messages(count)')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Verify user owns this event (customer or venue)
    if (event.customer_user_id !== user.id && event.venue_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check if event has messages
    const messageCount = event.messages[0]?.count || 0
    
    if (messageCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot cancel event with messages. Please contact support.' 
      }, { status: 403 })
    }
    
    // Cancel the event
    const { error: updateError } = await supabase
      .from('events')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason || 'Cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Error cancelling event:', updateError)
      return NextResponse.json({ 
        error: 'Failed to cancel event' 
      }, { status: 500 })
    }
    
    // TODO: Release Twilio number if assigned
    // This should be done via a separate admin function or scheduled job
    // to ensure proper cleanup and billing
    
    // TODO: Optionally notify customer of cancellation
    
    return NextResponse.json({ 
      success: true,
      message: 'Event cancelled successfully'
    })
    
  } catch (error) {
    console.error('Error in event cancellation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
