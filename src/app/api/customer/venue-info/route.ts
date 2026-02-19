import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const venueId = request.nextUrl.searchParams.get('venueId')

    if (!venueId) {
      return NextResponse.json({ error: 'Missing venueId' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('venues')
      .select('name, logo_url, slug')
      .eq('id', venueId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    return NextResponse.json({
      name: data.name || '',
      logo_url: data.logo_url || null,
      slug: data.slug || null
    })
  } catch (error) {
    console.error('Error fetching venue info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
