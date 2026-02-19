import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, confirmationText } = body

    if (confirmationText !== 'Delete') {
      return NextResponse.json({ error: 'Confirmation text must be exactly "Delete"' }, { status: 400 })
    }

    // Verify caller is a developer
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'developer') {
      return NextResponse.json({ error: 'Only developers can permanently delete events' }, { status: 403 })
    }

    // Load event with details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*, messages:messages(count)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const deletedInfo: any = { eventId, messagesDeleted: 0, analyticsDeleted: 0, twilioReleased: false, customerDeleted: false }

    // 1. Delete analytics_events for this event
    const { count: analyticsCount } = await supabaseAdmin
      .from('analytics_events')
      .delete()
      .eq('event_id', eventId)
      .select('id', { count: 'exact', head: true })
    deletedInfo.analyticsDeleted = analyticsCount || 0

    // 2. Delete all messages for this event
    const { count: messageCount } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('event_id', eventId)
      .select('id', { count: 'exact', head: true })
    deletedInfo.messagesDeleted = messageCount || 0

    // 2. Release Twilio number if assigned
    if (event.twilio_phone_sid) {
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
        await twilioClient.incomingPhoneNumbers(event.twilio_phone_sid).remove()
        deletedInfo.twilioReleased = true
      } catch (twilioErr: any) {
        console.error('Twilio release error (continuing):', twilioErr.message)
        deletedInfo.twilioReleaseError = twilioErr.message
      }
    }

    // 3. Delete the event
    const { error: deleteEventError } = await supabaseAdmin.from('events').delete().eq('id', eventId)
    if (deleteEventError) throw deleteEventError

    // 4. Delete the associated customer user if they have no other events
    if (event.customer_user_id) {
      const { count: otherEvents } = await supabaseAdmin
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', event.customer_user_id)

      if ((otherEvents || 0) === 0) {
        // No other events — safe to delete customer
        await supabaseAdmin.from('profiles').delete().eq('id', event.customer_user_id)
        await supabaseAdmin.auth.admin.deleteUser(event.customer_user_id)
        deletedInfo.customerDeleted = true
        deletedInfo.customerEmail = event.customer_email
      }
    }

    return NextResponse.json({ success: true, ...deletedInfo })
  } catch (error: any) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
