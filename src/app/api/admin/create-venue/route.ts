import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin API route - uses Service Role Key to bypass RLS
export async function POST(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Service Role Key to check admin role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get form data
    const body = await request.json()
    const {
      venueName,
      businessType,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      countryCode, // ISO 3166-1 alpha-2 code (GB, US, CA, etc.) - CRITICAL for Twilio
      website,
      instagram,
      subscriptionType,
      subscriptionStatus,
      logo,
      logoFileName
    } = body

    // Validate country code matches Twilio supported countries
    const validCountryCodes = ['GB', 'US', 'CA', 'AU', 'NZ', 'IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI', 'CH', 'AT', 'PL', 'PT']
    if (!validCountryCodes.includes(countryCode)) {
      return NextResponse.json({ 
        error: `Invalid country code. Must be one of: ${validCountryCodes.join(', ')}` 
      }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

    // 1. Create auth user for venue owner
    const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: ownerFirstName,
        last_name: ownerLastName,
        role: 'venue'
      }
    })

    if (authCreateError || !authData.user) {
      throw new Error(`Failed to create user: ${authCreateError?.message}`)
    }

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        email: ownerEmail,
        first_name: ownerFirstName,
        last_name: ownerLastName,
        phone: ownerPhone,
        role: 'venue'
      })

    if (profileError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // 3. Upload logo if provided
    let logoUrl = null
    if (logo && logoFileName) {
      const base64Data = logo.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `${userId}-${Date.now()}-${logoFileName}`
      
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('venue-logos')
        .upload(fileName, buffer, {
          contentType: logoFileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
        // Don't fail the whole operation for logo upload
      } else {
        const { data: urlData } = adminClient.storage
          .from('venue-logos')
          .getPublicUrl(fileName)
        logoUrl = urlData.publicUrl
      }
    }

    // 4. Create venue
    const { data: venueData, error: venueError } = await adminClient
      .from('venues')
      .insert({
        owner_id: userId,
        name: venueName,
        business_type: businessType,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city: city,
        county: county,
        postcode: postcode,
        country_code: countryCode, // CRITICAL: Used for Twilio phone number allocation by country
        website: website,
        instagram: instagram,
        subscription_type: subscriptionType,
        subscription_status: subscriptionStatus,
        logo_url: logoUrl,
        owner_email: ownerEmail,
        owner_phone: ownerPhone
      })
      .select()
      .single()

    if (venueError) {
      // Rollback: delete profile and auth user
      await adminClient.from('profiles').delete().eq('id', userId)
      await adminClient.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create venue: ${venueError.message}`)
    }

    return NextResponse.json({
      success: true,
      venue: venueData,
      temporaryPassword: tempPassword,
      message: 'Venue created successfully'
    })

  } catch (error: any) {
    console.error('Create venue error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
