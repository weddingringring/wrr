'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface MessageDetailModalProps {
  message: {
    id: string
    caller_number: string
    caller_name: string | null
    recording_url: string
    duration: number
    recorded_at: string
    is_favorite: boolean
    guest_photo_url: string | null
    notes: string | null
    tags: string[] | null
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedMessage: any) => void
}

export default function MessageDetailModal({ message, isOpen, onClose, onUpdate }: MessageDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [editData, setEditData] = useState({
    caller_name: message.caller_name || '',
    notes: message.notes || '',
    tags: (message as any).tags || []
  })
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
      audioRef.current.addEventListener('ended', handleEnded)
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('ended', handleEnded)
      }
    }
  }, [])
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleToggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_favorite: !message.is_favorite })
        .eq('id', message.id)
      
      if (error) throw error
      
      onUpdate({ ...message, is_favorite: !message.is_favorite })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }
  
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          caller_name: editData.caller_name || null,
          notes: editData.notes || null,
          tags: editData.tags.length > 0 ? editData.tags : null
        })
        .eq('id', message.id)
      
      if (error) throw error
      
      onUpdate({
        ...message,
        caller_name: editData.caller_name,
        notes: editData.notes,
        tags: editData.tags
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    try {
      // Get event_id from message
      const { data: messageData } = await supabase
        .from('messages')
        .select('event_id')
        .eq('id', message.id)
        .single()
      
      if (!messageData) throw new Error('Event not found')
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${messageData.event_id}/${message.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('message-photos')
        .upload(filePath, file, { upsert: true })
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('message-photos')
        .getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ guest_photo_url: publicUrl })
        .eq('id', message.id)
      
      if (updateError) throw updateError
      
      onUpdate({ ...message, guest_photo_url: publicUrl })
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setUploading(false)
    }
  }
  
  const handleDownload = async () => {
    try {
      const response = await fetch(message.recording_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${message.caller_name || 'message'}-${message.id}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading message:', error)
    }
  }
  
  const availableTags = ['Family', 'Friends', 'Funny', 'Emotional', 'Heartfelt', 'Work', 'Surprise']
  
  const toggleTag = (tag: string) => {
    if (editData.tags.includes(tag)) {
      setEditData({ ...editData, tags: editData.tags.filter(t => t !== tag) })
    } else {
      setEditData({ ...editData, tags: [...editData.tags, tag] })
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-sage-light/30 hover:bg-sage-light transition flex items-center justify-center z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Photo Section */}
          <div className="relative h-80 bg-gradient-to-br from-sage-light to-sage">
            {message.guest_photo_url ? (
              <img 
                src={message.guest_photo_url}
                alt="Guest"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-24 h-24 text-white/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-white/90 hover:bg-white text-charcoal rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Add Photo'}
                  </button>
                </div>
              </div>
            )}
            
            {message.guest_photo_url && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-charcoal rounded-lg font-medium transition text-sm"
              >
                Change Photo
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          {/* Content Section */}
          <div className="p-8">
            
            {/* Header with Actions */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.caller_name}
                    onChange={(e) => setEditData({ ...editData, caller_name: e.target.value })}
                    className="text-2xl font-medium text-charcoal border-b-2 border-deep-green focus:outline-none w-full"
                    placeholder="Guest name"
                  />
                ) : (
                  <h2 className="text-2xl font-medium text-charcoal">
                    {message.caller_name || 'Unknown Guest'}
                  </h2>
                )}
                <p className="text-sage-dark mt-1">
                  {new Date(message.recorded_at).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-lg transition ${
                    message.is_favorite
                      ? 'bg-rose-light text-rose'
                      : 'bg-sage-light/30 text-sage-dark hover:bg-sage-light'
                  }`}
                  title={message.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg className="w-5 h-5" fill={message.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="p-3 bg-sage-light/30 text-sage-dark rounded-lg hover:bg-sage-light transition"
                  title="Download message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                
                <button
                  className="p-3 bg-sage-light/30 text-sage-dark rounded-lg hover:bg-sage-light transition"
                  title="Share message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Audio Player */}
            <div className="bg-deep-green/5 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-deep-green text-white flex items-center justify-center hover:bg-deep-green-dark transition flex-shrink-0"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={message.duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-deep-green/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-deep-green"
                  />
                  <div className="flex justify-between text-xs text-sage-dark mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(message.duration)}</span>
                  </div>
                </div>
              </div>
              
              <audio ref={audioRef} src={message.recording_url} />
            </div>
            
            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal mb-3">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => isEditing && toggleTag(tag)}
                    disabled={!isEditing}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      editData.tags.includes(tag)
                        ? 'bg-deep-green text-white'
                        : 'bg-sage-light/30 text-sage-dark hover:bg-sage-light'
                    } ${!isEditing && 'cursor-default'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Add notes about this message..."
                />
              ) : (
                <div className="p-4 bg-sage-light/20 rounded-lg min-h-[100px]">
                  {message.notes ? (
                    <p className="text-charcoal whitespace-pre-wrap">{message.notes}</p>
                  ) : (
                    <p className="text-sage-dark italic">No notes yet</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Edit/Save Buttons */}
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditData({
                        caller_name: message.caller_name || '',
                        notes: message.notes || '',
                        tags: message.tags || []
                      })
                    }}
                    className="flex-1 py-3 border-2 border-sage-light text-charcoal rounded-lg font-medium hover:bg-sage-light/30 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-sage-light/30 text-charcoal rounded-lg font-medium hover:bg-sage-light transition"
                >
                  Edit Message
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
