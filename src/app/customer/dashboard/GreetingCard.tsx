'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface GreetingCardProps {
  eventId: string
  greetingAudioUrl: string | null
  greetingText: string
  onUpdate: () => void
}

export default function GreetingCard({ eventId, greetingAudioUrl, greetingText, onUpdate }: GreetingCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  const [showRecordingHelp, setShowRecordingHelp] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasGreeting = !!greetingAudioUrl

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3 or WAV)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.')
      return
    }

    await uploadGreeting(file)
  }

  const uploadGreeting = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get auth token to pass to API
      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('greeting', file)

      const response = await fetch(`/api/events/${eventId}/greeting`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload greeting')
      }

      setSuccess('Greeting uploaded successfully!')
      setShowUploadOptions(false)
      onUpdate()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload greeting')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteGreeting = async () => {
    if (!confirm('Are you sure you want to remove your custom audio greeting? Your greeting will revert to the automated voice.')) {
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/events/${eventId}/greeting`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete greeting')
      }

      setSuccess('Greeting removed. Using automated voice.')
      onUpdate()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete greeting')
    } finally {
      setIsUploading(false)
    }
  }

  const playCurrentGreeting = () => {
    if (greetingAudioUrl && audioRef.current) {
      audioRef.current.src = greetingAudioUrl
      audioRef.current.play()
    }
  }

  // Compact card when greeting exists
  if (hasGreeting && !showUploadOptions) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-deep-green">
        {error && (
          <div className="mb-4 p-3 bg-rose-light/50 border border-rose-light rounded-lg text-sm text-rose-dark">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-deep-green/10 border border-deep-green/30 rounded-lg text-sm text-deep-green">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-deep-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-charcoal">Custom Audio Greeting Active</h3>
            </div>
            <p className="text-sm text-sage-dark">
              Guests will hear your voice greeting when they call in.
            </p>
          </div>
          
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={playCurrentGreeting}
              className="px-4 py-2 text-sm bg-deep-green text-white hover:bg-deep-green-dark rounded-lg transition flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Preview Greeting
            </button>
            <button
              onClick={() => setShowUploadOptions(true)}
              className="px-4 py-2 text-sm text-sage-dark hover:text-charcoal border border-sage-light hover:border-sage rounded-lg transition"
            >
              Change Greeting
            </button>
          </div>
        </div>

        <audio ref={audioRef} className="hidden" />
      </div>
    )
  }

  // Prominent card when no greeting OR when changing greeting
  return (
    <div className="bg-gradient-to-br from-deep-green to-deep-green/80 rounded-xl shadow-lg text-white mb-8">
      {/* Collapsed State */}
      {isCollapsed && (
        <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(false)}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold mb-1">Upload a Custom Audio Greeting</h3>
              <p className="text-white/80 text-sm">Replace the automated voice with your own voice</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="p-8 relative">
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <div className="max-w-3xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif mb-2">
                  {hasGreeting ? 'Change Your Audio Greeting' : 'Upload a Custom Audio Greeting'}
                </h2>
                <p className="text-white/90 text-lg mb-4">
                  {hasGreeting 
                    ? 'Upload a new voice greeting to replace your current one.'
                    : 'Replace the automated voice greeting with your own voice. Record a personal message and upload it here.'}
                </p>
              </div>
            </div>

            {!hasGreeting && (
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm mb-2 text-white/90">
                  <strong>Current greeting (automated voice):</strong>
                </p>
                <p className="text-white italic">"{greetingText}"</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-rose-light/90 text-rose-dark rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Upload Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-white/90 text-deep-green rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Greeting uploaded successfully!</p>
                  <p className="text-sm text-deep-green/80">Your custom greeting is now active.</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto px-8 py-4 bg-white text-deep-green font-semibold rounded-lg hover:bg-white/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isUploading ? 'Uploading...' : 'Upload Audio File (MP3 or WAV)'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* How to Record Instructions (Collapsible) */}
            <div className="mb-6">
              <button
                onClick={() => setShowRecordingHelp(!showRecordingHelp)}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/15 rounded-lg transition text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">How to Record Your Greeting</span>
                </div>
                <svg 
                  className={`w-5 h-5 transition-transform ${showRecordingHelp ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showRecordingHelp && (
                <div className="mt-3 bg-white/10 rounded-lg p-5">
              <div className="space-y-3 text-sm text-white/90">
                <div>
                  <p className="font-medium mb-1">📱 iPhone:</p>
                  <p className="text-white/80">Use the built-in <strong>Voice Memos</strong> app to record. For best compatibility, convert to MP3 using a free app like <strong>Audio Converter</strong> or <strong>Media Converter</strong> from the App Store before uploading.</p>
                </div>

                <div>
                  <p className="font-medium mb-1">🤖 Android:</p>
                  <p className="text-white/80">Use <strong>Google Recorder</strong> (Pixel) or <strong>Samsung Voice Recorder</strong>. Export as MP3. If not available, download <strong>Easy Voice Recorder</strong> from the Play Store and save as MP3.</p>
                </div>

                <div>
                  <p className="font-medium mb-1">💻 Mac:</p>
                  <p className="text-white/80">Use <strong>QuickTime Player</strong> (File → New Audio Recording), then convert to MP3 using the built-in <strong>Music</strong> app or export as WAV directly from QuickTime.</p>
                </div>

                <div>
                  <p className="font-medium mb-1">🪟 Windows:</p>
                  <p className="text-white/80">Download <strong>Audacity</strong> (free) for recording with full control. Export as MP3 or WAV. The built-in Voice Recorder saves as M4A which may not be compatible.</p>
                </div>
              </div>
                </div>
              )}
            </div>

            {hasGreeting && showUploadOptions && (
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => setShowUploadOptions(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteGreeting}
                  disabled={isUploading}
                  className="px-4 py-2 bg-rose-light/20 hover:bg-rose-light/30 rounded-lg transition text-sm disabled:opacity-50"
                >
                  Use Automated Voice
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-white/20">
              <p className="text-sm text-white/80 mb-2"><strong>Tips for recording your greeting:</strong></p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Keep it under 30 seconds</li>
                <li>• Record in a quiet room with no background noise</li>
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Include your names and the occasion</li>
                <li>• End with "Please leave a message after the beep"</li>
                <li>• Accepted formats: MP3, WAV (max 10MB)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
