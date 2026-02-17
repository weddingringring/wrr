'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Play, Pause, Upload, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [editing, setEditing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasGreeting = !!greetingAudioUrl

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) { setError('Please upload an audio file (MP3 or WAV)'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File is too large. Maximum size is 10MB.'); return }
    await uploadGreeting(file)
  }

  const uploadGreeting = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('greeting', file)
      const response = await fetch(`/api/events/${eventId}/greeting`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload greeting')
      setSuccess('Greeting uploaded!')
      setEditing(false)
      onUpdate()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload greeting')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteGreeting = async () => {
    if (!confirm('Remove your custom greeting? It will revert to the automated voice.')) return
    setIsUploading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/events/${eventId}/greeting`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
      })
      if (!response.ok) throw new Error('Failed to delete greeting')
      setSuccess('Using automated voice.')
      setEditing(false)
      onUpdate()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete greeting')
    } finally {
      setIsUploading(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.src = greetingAudioUrl || ''
      audioRef.current.play()
      setIsPlaying(true)
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }

  // ── Editing / Upload view ──
  if (editing) {
    return (
      <div className="rounded-xl p-5 sm:p-6" style={{ background: '#3D5A4C' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-serif text-lg">
            {hasGreeting ? 'Change Greeting' : 'Upload Audio Greeting'}
          </h3>
          <button onClick={() => setEditing(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
            <ChevronUp size={20} className="text-white/70" />
          </button>
        </div>

        {!hasGreeting && greetingText && (
          <p className="text-white/70 text-sm mb-4 italic">Current: "{greetingText}"</p>
        )}

        {error && <p className="text-rose-light text-sm mb-3">{error}</p>}
        {success && <p className="text-white text-sm mb-3">{success}</p>}

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-deep-green text-sm font-medium rounded-lg hover:bg-white/90 transition disabled:opacity-50"
          >
            <Upload size={16} />
            {isUploading ? 'Uploading...' : 'Choose File (MP3 / WAV)'}
          </button>
          {hasGreeting && (
            <button
              onClick={deleteGreeting}
              disabled={isUploading}
              className="px-4 py-2.5 text-sm text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition disabled:opacity-50"
            >
              Use Automated Voice
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav" onChange={handleFileUpload} className="hidden" />

        {/* Collapsible help */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1.5 text-white/60 text-xs hover:text-white/80 transition"
        >
          How to record a greeting
          {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showHelp && (
          <div className="mt-3 text-xs text-white/70 space-y-2">
            <p><strong className="text-white/90">iPhone:</strong> Voice Memos app, convert to MP3 via Audio Converter</p>
            <p><strong className="text-white/90">Android:</strong> Google Recorder or Samsung Voice Recorder, export as MP3</p>
            <p><strong className="text-white/90">Mac:</strong> QuickTime Player → New Audio Recording, export as WAV</p>
            <p><strong className="text-white/90">Windows:</strong> Audacity (free), export as MP3 or WAV</p>
            <p className="pt-2 border-t border-white/10">Keep it under 30 seconds. Speak clearly. End with "Please leave a message after the beep."</p>
          </div>
        )}
      </div>
    )
  }

  // ── Compact default view (dark green bar, click to expand) ──
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition hover:opacity-90"
      style={{ background: '#3D5A4C' }}
      onClick={() => !hasGreeting ? setEditing(true) : undefined}
    >
      {/* Play button (only if custom greeting exists) */}
      {hasGreeting && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay() }}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          {isPlaying
            ? <Pause size={15} fill="white" stroke="white" />
            : <Play size={15} fill="white" stroke="white" style={{ marginLeft: '1px' }} />
          }
        </button>
      )}

      {!hasGreeting && (
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <Upload size={15} className="text-white" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="truncate text-white font-serif" style={{ fontSize: '1.05rem' }}>
          {hasGreeting ? 'Custom audio greeting active' : 'Upload a personalised greeting for your guests'}
        </p>
      </div>

      {success && <span className="text-xs text-white/80 flex-shrink-0">{success}</span>}

      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition"
        title={hasGreeting ? 'Change greeting' : 'Record a greeting'}
      >
        <ChevronDown size={18} className="text-white/70" />
      </button>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
