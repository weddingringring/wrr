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
    const { venueId, confirmationText } = body

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
      return NextResponse.json({ error: 'Only developers can permanently delete venues' }, { status: 403 })
    }

    // Load venue
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()

    if (venueError || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Load all events for this venue
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, twilio_phone_sid, customer_user_id, customer_email')
      .eq('venue_id', venueId)

    const deletedInfo: any = {
      venueId, venueName: venue.name,
      eventsDeleted: 0, messagesDeleted: 0, twilioReleased: 0, customersDeleted: 0,
      venueOwnerDeleted: false
    }

    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

    // Process each event
    for (const event of (events || [])) {
      // Delete analytics_events
      await supabaseAdmin.from('analytics_events').delete().eq('event_id', event.id)

      // Delete messages
      const { count } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' })
        .eq('event_id', event.id)
      deletedInfo.messagesDeleted += (count || 0)

      // Release Twilio number
      if (event.twilio_phone_sid) {
        try {
          await twilioClient.incomingPhoneNumbers(event.twilio_phone_sid).remove()
          deletedInfo.twilioReleased++
        } catch (err: any) {
          console.error(`Twilio release failed for ${event.twilio_phone_sid}:`, err.message)
        }
      }

      // Delete event
      await supabaseAdmin.from('events').delete().eq('id', event.id)
      deletedInfo.eventsDeleted++

      // Delete customer user if no other events
      if (event.customer_user_id) {
        const { count: otherEvents } = await supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('customer_user_id', event.customer_user_id)

        if ((otherEvents || 0) === 0) {
          await supabaseAdmin.from('profiles').delete().eq('id', event.customer_user_id)
          await supabaseAdmin.auth.admin.deleteUser(event.customer_user_id)
          deletedInfo.customersDeleted++
        }
      }
    }

    // Unassign any phones from this venue
    await supabaseAdmin.from('phones').update({ venue_id: null, status: 'available' }).eq('venue_id', venueId)

    // Delete the venue
    await supabaseAdmin.from('venues').delete().eq('id', venueId)

    // Delete the venue owner profile/auth
    if (venue.owner_id) {
      await supabaseAdmin.from('profiles').delete().eq('id', venue.owner_id)
      await supabaseAdmin.auth.admin.deleteUser(venue.owner_id)
      deletedInfo.venueOwnerDeleted = true
    }

    return NextResponse.json({ success: true, ...deletedInfo })
  } catch (error: any) {
    console.error('Delete venue error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
