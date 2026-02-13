import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use Service Role Key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This has admin privileges
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
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
      venueName,
      businessType,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      countryCode,
      website,
      instagram,
      subscriptionType,
      subscriptionStatus,
      logo,
      logoFileName
    } = body

    // Verify the requesting user is an admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'Aa1!'

    // Create auth user with Service Role (has admin privileges)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: ownerFirstName,
        last_name: ownerLastName,
        role: 'venue'
      }
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const venueId = crypto.randomUUID()
    let logoUrl = null

    // Upload logo if provided
    if (logo && logoFileName) {
      try {
        // Convert base64 to buffer
        const base64Data = logo.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Generate unique filename
        const fileExt = logoFileName.split('.').pop()
        const fileName = `${venueId}.${fileExt}`
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('venue-logos')
          .upload(fileName, buffer, {
            contentType: logo.split(';')[0].split(':')[1],
            upsert: true
          })

        if (uploadError) {
          console.error('Logo upload error:', uploadError)
          // Don't fail the whole operation if logo upload fails
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('venue-logos')
            .getPublicUrl(fileName)
          
          logoUrl = publicUrl
        }
      } catch (logoError) {
        console.error('Logo processing error:', logoError)
        // Continue without logo
      }
    }

    // Create venue record
    const { error: venueError } = await supabaseAdmin
      .from('venues')
      .insert({
        id: venueId,
        owner_id: authData.user.id,
        name: venueName,
        business_type: businessType,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city: city,
        county: county,
        postcode: postcode,
        country: countryCode === 'GB' ? 'UK' : 'Other',
        primary_contact_name: `${ownerFirstName} ${ownerLastName}`,
        primary_contact_email: ownerEmail,
        primary_contact_phone: ownerPhone,
        website: website || null,
        instagram_handle: instagram || null,
        logo_url: logoUrl,
        subscription_type: subscriptionType,
        subscription_status: subscriptionStatus,
        is_active: true,
      })

    if (venueError) {
      console.error('Create venue error:', venueError)
      return NextResponse.json({ error: venueError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      temporaryPassword,
      userId: authData.user.id
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
