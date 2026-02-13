import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use Service Role Key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      eventType,
      eventTypeOther,
      eventDate,
      venueLocation,
      partner1FirstName,
      partner1LastName,
      partner2FirstName,
      partner2LastName,
      customerEmail,
      customerPhone,
      age,
      yearsTogether,
      companyName,
      expectedGuestCount,
      specialRequirements,
      notes
    } = body

    // Verify the requesting user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get venue ID for this user
    const { data: venueData } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!venueData) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Create customer auth account
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
    
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: partner1FirstName,
        last_name: partner1LastName,
        role: 'customer'
      }
    })
    
    if (createAuthError) {
      console.error('Auth error:', createAuthError)
      return NextResponse.json({ error: createAuthError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create customer account' }, { status: 500 })
    }

    // Determine event name
    const eventTypeFinal = eventType === 'other' ? eventTypeOther : eventType
    const partner1Name = `${partner1FirstName} ${partner1LastName}`.trim()
    const partner2Name = partner2FirstName && partner2LastName 
      ? `${partner2FirstName} ${partner2LastName}`.trim() 
      : null

    // Create event
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        venue_id: venueData.id,
        customer_id: authData.user.id,
        event_type: eventTypeFinal,
        event_date: eventDate,
        venue_location: venueLocation || null,
        partner_1_name: partner1Name,
        partner_2_name: partner2Name,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        age: age ? parseInt(age) : null,
        years_together: yearsTogether ? parseInt(yearsTogether) : null,
        company_name: companyName || null,
        expected_guest_count: expectedGuestCount ? parseInt(expectedGuestCount) : null,
        special_requirements: specialRequirements || null,
        notes: notes || null,
        status: 'active'
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event error:', eventError)
      return NextResponse.json({ error: eventError.message }, { status: 400 })
    }

    // TODO: Send welcome email to customer with login credentials
    // For now, just return success

    return NextResponse.json({ 
      success: true,
      eventId: eventData.id,
      temporaryPassword: tempPassword
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
