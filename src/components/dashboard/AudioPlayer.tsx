'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  url: string
  duration: number
  onPlay?: () => void
}

export default function AudioPlayer({ url, duration, onPlay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const handleLoadedData = () => setIsLoaded(true)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])
  
  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
        
        if (onPlay) {
          onPlay()
        }
      } catch (error) {
        console.error('Playback failed:', error)
      }
    }
  }
  
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setCurrentTime(audio.currentTime)
    }
  }
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const bounds = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - bounds.left) / bounds.width
    audio.currentTime = percent * duration
    setCurrentTime(audio.currentTime)
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  
  return (
    <div className="flex items-center gap-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
      />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={!isLoaded}
        className="w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center hover:bg-deep-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        {isPlaying ? (
          // Pause icon
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
          </svg>
        ) : (
          // Play icon
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4l10 6-10 6V4z" />
          </svg>
        )}
      </button>
      
      {/* Progress Bar */}
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="h-2 bg-sage-light rounded-full overflow-hidden cursor-pointer group"
        >
          <div
            className="h-full bg-deep-green transition-all duration-100 group-hover:bg-deep-green-dark"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="flex justify-between text-xs text-sage-dark mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
