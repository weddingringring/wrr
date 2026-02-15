import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client to bypass RLS for signed URL generation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { recordingUrl, bucket } = await request.json()

    if (!recordingUrl) {
      return NextResponse.json({ error: 'Missing recordingUrl' }, { status: 400 })
    }

    const bucketName = bucket || 'message-recordings'

    // Extract file path from public URL
    // Format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
    let filePath: string

    if (recordingUrl.includes(`/storage/v1/object/public/${bucketName}/`)) {
      filePath = recordingUrl.split(`/storage/v1/object/public/${bucketName}/`)[1]
    } else if (recordingUrl.includes(`/storage/v1/object/sign/${bucketName}/`)) {
      // Already a signed URL path - extract before query params
      const pathPart = recordingUrl.split(`/storage/v1/object/sign/${bucketName}/`)[1]
      filePath = pathPart?.split('?')[0]
    } else {
      // Might just be the path itself (e.g. "event_id/recording_sid.mp3")
      filePath = recordingUrl
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Could not extract file path' }, { status: 400 })
    }

    // Decode URI components in case path has encoded characters
    filePath = decodeURIComponent(filePath)

    // Generate a signed URL valid for 1 hour
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60) // 1 hour

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error('Error in signed-url route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
