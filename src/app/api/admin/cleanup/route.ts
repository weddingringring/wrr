import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

// One-off cleanup route - DELETE ALL test data
// Remove this file after use — not for production
export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const token = authHeader.replace('Bearer ', '')

    // Verify caller is admin
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Require confirmation body
    const body = await request.json()
    if (body.confirm !== 'DELETE_EVERYTHING') {
      return NextResponse.json({ 
        error: 'Send { "confirm": "DELETE_EVERYTHING" } to proceed' 
      }, { status: 400 })
    }

    const summary: Record<string, any> = {}

    // ── 1. Collect Twilio numbers to release ──
    const { data: eventsWithNumbers } = await adminClient
      .from('events')
      .select('id, twilio_phone_number, twilio_phone_sid')
      .not('twilio_phone_sid', 'is', null)

    const twilioResults: string[] = []
    if (eventsWithNumbers && eventsWithNumbers.length > 0) {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID
      const twilioToken = process.env.TWILIO_AUTH_TOKEN

      if (twilioSid && twilioToken) {
        const twilioClient = twilio(twilioSid, twilioToken)

        for (const evt of eventsWithNumbers) {
          if (!evt.twilio_phone_sid) continue
          try {
            await twilioClient.incomingPhoneNumbers(evt.twilio_phone_sid).remove()
            twilioResults.push(`✅ Released ${evt.twilio_phone_number}`)
          } catch (err: any) {
            if (err.code === 20404) {
              twilioResults.push(`⚠️ ${evt.twilio_phone_number} already gone in Twilio`)
            } else {
              twilioResults.push(`❌ Failed to release ${evt.twilio_phone_number}: ${err.message}`)
            }
          }
        }
      } else {
        twilioResults.push('⚠️ Twilio credentials not set — release numbers manually')
      }
    }
    summary.twilio = twilioResults

    // ── 2. Delete analytics_events ──
    const { count: analyticsCount } = await adminClient
      .from('analytics_events')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000') // match all
    summary.analytics_events_deleted = analyticsCount ?? 0

    // ── 3. Delete messages ──
    const { count: messagesCount } = await adminClient
      .from('messages')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    summary.messages_deleted = messagesCount ?? 0

    // ── 4. Delete events ──
    const { count: eventsCount } = await adminClient
      .from('events')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    summary.events_deleted = eventsCount ?? 0

    // ── 5. Delete venues ──
    const { count: venuesCount } = await adminClient
      .from('venues')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    summary.venues_deleted = venuesCount ?? 0

    // ── 6. Delete non-admin profiles + auth users ──
    const { data: nonAdminProfiles } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .neq('role', 'admin')

    let profilesDeleted = 0
    let authUsersDeleted = 0
    const authErrors: string[] = []

    if (nonAdminProfiles) {
      for (const p of nonAdminProfiles) {
        // Delete profile row first
        await adminClient.from('profiles').delete().eq('id', p.id)
        profilesDeleted++

        // Delete auth user
        try {
          await adminClient.auth.admin.deleteUser(p.id)
          authUsersDeleted++
        } catch (err: any) {
          authErrors.push(`${p.email}: ${err.message}`)
        }
      }
    }

    summary.profiles_deleted = profilesDeleted
    summary.auth_users_deleted = authUsersDeleted
    if (authErrors.length > 0) summary.auth_errors = authErrors

    // ── 7. Clean storage buckets (optional — recordings & greetings) ──
    for (const bucket of ['recordings', 'greetings']) {
      try {
        const { data: files } = await adminClient.storage.from(bucket).list('', { limit: 1000 })
        if (files && files.length > 0) {
          const paths = files.map(f => f.name)
          await adminClient.storage.from(bucket).remove(paths)
          summary[`${bucket}_files_deleted`] = paths.length
        } else {
          summary[`${bucket}_files_deleted`] = 0
        }
      } catch (err: any) {
        summary[`${bucket}_error`] = err.message
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup complete. Delete this route file now.',
      summary 
    })

  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
