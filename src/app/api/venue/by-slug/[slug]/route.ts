import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Public endpoint — no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug || slug.length > 100) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .select('id, name, logo_url, slug')
      .eq('slug', slug.toLowerCase())
      .single()

    if (error || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: venue.id,
      name: venue.name,
      logoUrl: venue.logo_url,
      slug: venue.slug,
    })
  } catch (error) {
    console.error('Venue slug lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
