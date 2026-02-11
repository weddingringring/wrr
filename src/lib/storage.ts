import { createClient } from '@supabase/supabase-js'

// Client for server-side operations (Twilio webhooks, cron jobs)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Client for client-side operations (authenticated users)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Upload a recording from Twilio webhook
 * Uses service role key for server-side access
 */
export async function uploadRecording(
  eventId: string,
  messageId: string,
  audioBuffer: Buffer,
  contentType: string = 'audio/mpeg'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { data, error } = await supabaseAdmin.storage
      .from('recordings')
      .upload(fileName, audioBuffer, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { url: null, error: error.message }
    }

    // Create a signed URL valid for 1 year (recordings are permanent)
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('recordings')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return { url: null, error: urlError.message }
    }

    return { url: urlData.signedUrl, error: null }
  } catch (error: any) {
    console.error('Failed to upload recording:', error)
    return { url: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Upload a custom greeting audio file
 * Uses client-side auth (customer must be logged in)
 */
export async function uploadGreeting(
  eventId: string,
  audioFile: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate file size (5 MB max)
    if (audioFile.size > 5 * 1024 * 1024) {
      return { url: null, error: 'File size exceeds 5 MB limit' }
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a']
    if (!validTypes.includes(audioFile.type)) {
      return { url: null, error: 'Invalid file type. Use MP3, WAV, or M4A' }
    }

    const fileName = `${eventId}/greeting.mp3`
    
    const { data, error } = await supabaseClient.storage
      .from('greetings')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: true, // Allow updating existing greeting
        cacheControl: '3600',
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { url: null, error: error.message }
    }

    // Create signed URL for private access
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from('greetings')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return { url: null, error: urlError.message }
    }

    return { url: urlData.signedUrl, error: null }
  } catch (error: any) {
    console.error('Failed to upload greeting:', error)
    return { url: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Delete a custom greeting
 */
export async function deleteGreeting(
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const fileName = `${eventId}/greeting.mp3`
    
    const { error } = await supabaseClient.storage
      .from('greetings')
      .remove([fileName])

    if (error) {
      console.error('Error deleting greeting:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Failed to delete greeting:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Upload a venue logo
 * Public bucket - anyone can view
 */
export async function uploadVenueLogo(
  venueId: string,
  logoFile: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate file size (2 MB max)
    if (logoFile.size > 2 * 1024 * 1024) {
      return { url: null, error: 'File size exceeds 2 MB limit' }
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(logoFile.type)) {
      return { url: null, error: 'Invalid file type. Use PNG, JPG, SVG, or WEBP' }
    }

    const fileExt = logoFile.name.split('.').pop() || 'png'
    const fileName = `${venueId}.${fileExt}`
    
    const { data, error } = await supabaseClient.storage
      .from('venue-logos')
      .upload(fileName, logoFile, {
        contentType: logoFile.type,
        upsert: true, // Allow updating logo
        cacheControl: '3600',
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { url: null, error: error.message }
    }

    // Get public URL (no signed URL needed for public bucket)
    const { data: urlData } = supabaseClient.storage
      .from('venue-logos')
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl, error: null }
  } catch (error: any) {
    console.error('Failed to upload venue logo:', error)
    return { url: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Delete a venue logo
 */
export async function deleteVenueLogo(
  venueId: string,
  fileExtension: string = 'png'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const fileName = `${venueId}.${fileExtension}`
    
    const { error } = await supabaseClient.storage
      .from('venue-logos')
      .remove([fileName])

    if (error) {
      console.error('Error deleting logo:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Failed to delete logo:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Get a signed URL for a recording (for playback in dashboard)
 * Creates a temporary URL valid for 1 hour
 */
export async function getRecordingUrl(
  eventId: string,
  messageId: string,
  expiresInSeconds: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { data, error } = await supabaseClient.storage
      .from('recordings')
      .createSignedUrl(fileName, expiresInSeconds)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl, error: null }
  } catch (error: any) {
    console.error('Failed to get recording URL:', error)
    return { url: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Get a signed URL for a greeting (for Twilio playback)
 * Creates a temporary URL valid for specified duration
 */
export async function getGreetingUrl(
  eventId: string,
  expiresInSeconds: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileName = `${eventId}/greeting.mp3`
    
    // Use admin client for Twilio access (service role)
    const { data, error } = await supabaseAdmin.storage
      .from('greetings')
      .createSignedUrl(fileName, expiresInSeconds)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl, error: null }
  } catch (error: any) {
    console.error('Failed to get greeting URL:', error)
    return { url: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Download a recording as a buffer (for admin operations)
 */
export async function downloadRecording(
  eventId: string,
  messageId: string
): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { data, error } = await supabaseAdmin.storage
      .from('recordings')
      .download(fileName)

    if (error) {
      console.error('Error downloading recording:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Failed to download recording:', error)
    return { data: null, error: error.message || 'Unknown error' }
  }
}

/**
 * List all recordings for an event
 */
export async function listEventRecordings(
  eventId: string
): Promise<{ files: string[]; error: string | null }> {
  try {
    const { data, error } = await supabaseClient.storage
      .from('recordings')
      .list(eventId)

    if (error) {
      console.error('Error listing recordings:', error)
      return { files: [], error: error.message }
    }

    const fileNames = data.map(file => file.name)
    return { files: fileNames, error: null }
  } catch (error: any) {
    console.error('Failed to list recordings:', error)
    return { files: [], error: error.message || 'Unknown error' }
  }
}

/**
 * Delete a recording (admin only)
 */
export async function deleteRecording(
  eventId: string,
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { error } = await supabaseAdmin.storage
      .from('recordings')
      .remove([fileName])

    if (error) {
      console.error('Error deleting recording:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Failed to delete recording:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
