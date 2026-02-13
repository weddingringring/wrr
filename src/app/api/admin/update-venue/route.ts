import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
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
      venueId,
      venueName,
      businessType,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      countryCode, // ISO 3166-1 alpha-2 code
      website,
      instagram,
      subscriptionType,
      subscriptionStatus,
      logo,
      logoFileName
    } = body

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 })
    }

    // Validate country code if provided
    const validCountryCodes = ['GB', 'US', 'CA', 'AU', 'NZ', 'IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI', 'CH', 'AT', 'PL', 'PT']
    if (countryCode && !validCountryCodes.includes(countryCode)) {
      return NextResponse.json({ 
        error: `Invalid country code. Must be one of: ${validCountryCodes.join(', ')}` 
      }, { status: 400 })
    }

    // Use Service Role Key for admin operations
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Upload new logo if provided
    let logoUrl = null
    if (logo && logoFileName) {
      const base64Data = logo.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `${venueId}-${Date.now()}-${logoFileName}`
      
      const { error: uploadError } = await adminClient.storage
        .from('venue-logos')
        .upload(fileName, buffer, {
          contentType: logoFileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
      } else {
        const { data: urlData } = adminClient.storage
          .from('venue-logos')
          .getPublicUrl(fileName)
        logoUrl = urlData.publicUrl
      }
    }

    // Prepare update data
    const updateData: any = {
      name: venueName,
      business_type: businessType,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: city,
      county: county,
      postcode: postcode,
      country_code: countryCode, // CRITICAL: Can be changed if venue moves or expands
      website: website,
      instagram_handle: instagram,
      subscription_type: subscriptionType,
      subscription_status: subscriptionStatus,
    }

    // Only update logo if new one was uploaded
    if (logoUrl) {
      updateData.logo_url = logoUrl
    }

    // Update venue
    const { data: venueData, error: venueError } = await adminClient
      .from('venues')
      .update(updateData)
      .eq('id', venueId)
      .select()
      .single()

    if (venueError) {
      throw new Error(`Failed to update venue: ${venueError.message}`)
    }

    return NextResponse.json({
      success: true,
      venue: venueData,
      message: 'Venue updated successfully'
    })

  } catch (error: any) {
    console.error('Update venue error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
