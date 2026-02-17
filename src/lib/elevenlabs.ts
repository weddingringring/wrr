import { createClient } from '@supabase/supabase-js'

// ElevenLabs premade voice IDs mapped by country/accent
// These are stable premade voices available to all accounts
const VOICE_MAP: Record<string, { voiceId: string; name: string }> = {
  // British English
  GB: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (British, warm)' },
  // American English
  US: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (American, warm)' },
  // Australian English
  AU: { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Australian, casual)' },
  // Canadian English (use American)
  CA: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (American, warm)' },
  // Irish English
  IE: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (British, warm)' },
  // New Zealand (use Australian)
  NZ: { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Australian, casual)' },
}

const DEFAULT_VOICE = VOICE_MAP.GB

/**
 * Generate an AI greeting audio using ElevenLabs TTS.
 * 
 * Priority chain for voice webhook:
 *   1. User-uploaded audio (greeting_audio_url)
 *   2. AI-generated audio (ai_greeting_audio_url) ← this
 *   3. Twilio TTS fallback (greeting_text read by Polly.Amy)
 */
export async function generateAiGreeting(
  eventId: string,
  greetingText: string,
  countryCode: string = 'GB'
): Promise<{ url: string } | { error: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.warn('ELEVENLABS_API_KEY not set — skipping AI greeting generation')
    return { error: 'ElevenLabs API key not configured' }
  }

  const voice = VOICE_MAP[countryCode.toUpperCase()] || DEFAULT_VOICE
  console.log(`Generating AI greeting for event ${eventId} with voice: ${voice.name}`)

  try {
    // Call ElevenLabs TTS API directly (no SDK dependency)
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: greetingText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.7,        // Warm and consistent
            similarity_boost: 0.8, // Natural sounding
            style: 0.15,           // Slight warmth/expressiveness
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      return { error: `ElevenLabs API error: ${response.status}` }
    }

    // Get audio as buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const filePath = `ai-greetings/${eventId}.mp3`

    // Delete any existing AI greeting for this event
    await supabase.storage.from('event-greetings').remove([filePath])

    // Upload new audio
    const { error: uploadError } = await supabase.storage
      .from('event-greetings')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { error: `Storage upload error: ${uploadError.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-greetings')
      .getPublicUrl(filePath)

    // Update the event record
    const { error: updateError } = await supabase
      .from('events')
      .update({ ai_greeting_audio_url: urlData.publicUrl })
      .eq('id', eventId)

    if (updateError) {
      console.error('Event update error:', updateError)
      return { error: `Event update error: ${updateError.message}` }
    }

    console.log(`AI greeting generated for event ${eventId}: ${urlData.publicUrl}`)
    return { url: urlData.publicUrl }

  } catch (err: any) {
    console.error('ElevenLabs generation failed:', err)
    return { error: err.message || 'Unknown error generating AI greeting' }
  }
}

/**
 * Regenerate the AI greeting (e.g. if greeting_text changes).
 * Looks up the event's greeting_text and venue country code.
 */
export async function regenerateAiGreeting(eventId: string): Promise<{ url: string } | { error: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: event, error } = await supabase
    .from('events')
    .select('greeting_text, venue_id')
    .eq('id', eventId)
    .single()

  if (error || !event?.greeting_text) {
    return { error: 'Event not found or no greeting text' }
  }

  // Get venue country
  const { data: venue } = await supabase
    .from('venues')
    .select('country_code')
    .eq('id', event.venue_id)
    .single()

  const countryCode = venue?.country_code || 'GB'
  return generateAiGreeting(eventId, event.greeting_text, countryCode)
}


// ============================================================
// VOICE ISOLATION — Enhance guest message recordings
// ============================================================

/**
 * Enhance a guest message recording using ElevenLabs Voice Isolator.
 * Downloads the original, sends to Voice Isolator API, uploads the
 * enhanced version, and updates the message record.
 *
 * Original recording is always preserved at `recording_url`.
 * Enhanced version stored at `enhanced_recording_url`.
 */
export async function enhanceRecording(
  messageId: string,
  originalUrl: string,
  eventId: string
): Promise<{ url: string } | { error: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return { error: 'ElevenLabs API key not configured' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log(`Enhancing recording for message ${messageId}`)

    // 1. Download original audio from Supabase storage
    //    The URL may be a public URL — extract the path to download via storage API
    let audioBuffer: Buffer

    // Try fetching directly from the public URL
    const downloadRes = await fetch(originalUrl)
    if (!downloadRes.ok) {
      return { error: `Failed to download original recording: ${downloadRes.status}` }
    }
    audioBuffer = Buffer.from(await downloadRes.arrayBuffer())

    // 2. Send to ElevenLabs Voice Isolator API
    const formData = new FormData()
    formData.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'recording.mp3')

    const isolateRes = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    })

    if (!isolateRes.ok) {
      const errorText = await isolateRes.text()
      console.error('Voice Isolator API error:', isolateRes.status, errorText)
      return { error: `Voice Isolator API error: ${isolateRes.status}` }
    }

    // 3. Get enhanced audio
    const enhancedBuffer = Buffer.from(await isolateRes.arrayBuffer())

    // 4. Upload enhanced version to Supabase Storage
    const enhancedPath = `${eventId}/enhanced_${messageId}.mp3`

    const { error: uploadError } = await supabase.storage
      .from('message-recordings')
      .upload(enhancedPath, enhancedBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Enhanced upload error:', uploadError)
      return { error: `Storage upload error: ${uploadError.message}` }
    }

    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from('message-recordings')
      .getPublicUrl(enhancedPath)

    // 6. Update message record
    const { error: updateError } = await supabase
      .from('messages')
      .update({ enhanced_recording_url: urlData.publicUrl })
      .eq('id', messageId)

    if (updateError) {
      console.error('Message update error:', updateError)
      return { error: `Message update error: ${updateError.message}` }
    }

    console.log(`✓ Enhanced recording for message ${messageId}`)
    return { url: urlData.publicUrl }

  } catch (err: any) {
    console.error('Voice isolation failed:', err)
    return { error: err.message || 'Unknown error during voice isolation' }
  }
}
