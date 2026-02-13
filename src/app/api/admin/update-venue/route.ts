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
      venueId,
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
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('venue-logos')
            .getPublicUrl(fileName)
          
          logoUrl = publicUrl
        }
      } catch (logoError) {
        console.error('Logo processing error:', logoError)
      }
    }

    // Update venue record
    const updateData: any = {
      name: venueName,
      business_type: businessType,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: city,
      county: county,
      postcode: postcode,
      country: countryCode === 'GB' ? 'UK' : 'Other',
      website: website || null,
      instagram_handle: instagram || null,
      subscription_type: subscriptionType,
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString()
    }

    // Only update logo if a new one was provided
    if (logoUrl) {
      updateData.logo_url = logoUrl
    }

    const { error: venueError } = await supabaseAdmin
      .from('venues')
      .update(updateData)
      .eq('id', venueId)

    if (venueError) {
      console.error('Update venue error:', venueError)
      return NextResponse.json({ error: venueError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      venueId: venueId
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
