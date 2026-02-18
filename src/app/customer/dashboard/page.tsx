'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import GreetingCard from './GreetingCard'
import MessageCardStack from './MessageCardStack'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import JSZip from 'jszip'
import {
  Play, Pause, Heart, Download, Share2, Search,
  Filter, X, Trash2, Tag, Clock, Phone, User,
  Star, Music, ChevronDown, MoreHorizontal,
  Image as ImageIcon, Upload, Check, Undo2,
  Archive, Settings, LogOut, MessageCircle, Mic, Copy,
  LayoutGrid, Layers, SlidersHorizontal
} from 'lucide-react'

interface Message {
  id: string
  caller_number: string
  recording_url: string
  enhanced_recording_url: string | null
  duration_seconds: number
  duration: number
  created_at: string
  recorded_at: string
  is_favorite: boolean
  is_favorited: boolean
  caller_name: string | null
  notes: string | null
  tags: string[] | null
  guest_photo_url: string | null
  is_deleted: boolean
}

const AVAILABLE_TAGS = [
  'Family', 'Friends', 'Funny', 'Emotional', 'Heartfelt',
  'Work colleagues', 'Surprise', 'Drunk 😂', 'Kids'
]

export default function CustomerDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAsId = searchParams.get('viewAs')
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'trash'>('all')
  const [greetingExpanded, setGreetingExpanded] = useState(false)
  const [greetingUploading, setGreetingUploading] = useState(false)
  const [greetingError, setGreetingError] = useState<string | null>(null)
  const [greetingSuccess, setGreetingSuccess] = useState<string | null>(null)
  const [numberCopied, setNumberCopied] = useState(false)
  const greetingFileRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'tiles' | 'cards'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoMessageRef = useRef<string | null>(null)
  const signedUrlCache = useRef<Record<string, { url: string; expires: number }>>({})
  const photoUrlCache = useRef<Record<string, { url: string; expires: number }>>({})
  const [photoSignedUrls, setPhotoSignedUrls] = useState<Record<string, string>>({})

  // Get a signed URL for a photo (cached for 50 minutes)
  const getPhotoSignedUrl = async (photoPath: string): Promise<string> => {
    if (!photoPath) return ''

    // If it's already a full URL (legacy data), return as-is
    if (photoPath.startsWith('http')) return photoPath

    const cached = photoUrlCache.current[photoPath]
    if (cached && cached.expires > Date.now() + 10 * 60 * 1000) {
      return cached.url
    }

    try {
      const res = await fetch('/api/customer/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingUrl: photoPath, bucket: 'message-photos' })
      })

      if (!res.ok) return ''

      const data = await res.json()

      photoUrlCache.current[photoPath] = {
        url: data.signedUrl,
        expires: Date.now() + 50 * 60 * 1000
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error getting photo signed URL:', error)
      return ''
    }
  }

  // Get a signed URL for a recording (cached for 50 minutes)
  const getSignedUrl = async (recordingUrl: string): Promise<string> => {
    if (!recordingUrl) return ''
    
    // Check cache first (valid if more than 10 min remaining)
    const cached = signedUrlCache.current[recordingUrl]
    if (cached && cached.expires > Date.now() + 10 * 60 * 1000) {
      return cached.url
    }

    try {
      const res = await fetch('/api/customer/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingUrl })
      })
      
      if (!res.ok) {
        console.error('Failed to get signed URL:', res.status)
        return recordingUrl // Fallback to original URL
      }

      const data = await res.json()
      
      // Cache for 50 minutes (signed URLs valid for 60 min)
      signedUrlCache.current[recordingUrl] = {
        url: data.signedUrl,
        expires: Date.now() + 50 * 60 * 1000
      }
      
      return data.signedUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return recordingUrl // Fallback to original URL
    }
  }

  // Helper to update messages via API (bypasses RLS)
  const updateMessage = async (messageId: string, updates: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/customer/messages', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ messageId, updates })
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update message')
    }
    return res.json()
  }

  // Set Safari status bar color to match page background
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', '#FFEFEF')
    // Override body/html background so Safari safe area matches
    const prevBodyBg = document.body.style.background
    const prevHtmlBg = document.documentElement.style.backgroundColor
    document.body.style.background = '#FFEFEF'
    document.documentElement.style.backgroundColor = '#FFEFEF'
    return () => {
      if (meta) meta.setAttribute('content', '#ffffff')
      document.body.style.background = prevBodyBg
      document.documentElement.style.backgroundColor = prevHtmlBg
    }
  }, [])

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio()
    }
    checkAuth()
    loadMessages()

    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // Fetch signed URLs for message photos
  useEffect(() => {
    const messagesWithPhotos = messages.filter(m => m.guest_photo_url && !m.guest_photo_url.startsWith('http'))
    if (messagesWithPhotos.length === 0) return

    const fetchPhotoUrls = async () => {
      const newUrls: Record<string, string> = { ...photoSignedUrls }
      await Promise.all(
        messagesWithPhotos.map(async (m) => {
          const cached = photoUrlCache.current[m.guest_photo_url!]
          if (cached && cached.expires > Date.now() + 10 * 60 * 1000) {
            newUrls[m.id] = cached.url
            return
          }
          const url = await getPhotoSignedUrl(m.guest_photo_url!)
          if (url) newUrls[m.id] = url
        })
      )
      setPhotoSignedUrls(newUrls)
    }
    fetchPhotoUrls()
  }, [messages])

  useEffect(() => {
    filterAndSortMessages()
  }, [filter, searchQuery, sortBy, selectedTags, messages])

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (currentlyPlaying && audio.duration) {
        setPlaybackProgress(prev => ({
          ...prev,
          [currentlyPlaying]: (audio.currentTime / audio.duration) * 100
        }))
      }
    }

    audio.addEventListener('timeupdate', updateProgress)
    return () => audio.removeEventListener('timeupdate', updateProgress)
  }, [currentlyPlaying])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    // Check if this is a developer impersonation
    let targetUserId = user.id
    if (viewAsId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'developer') {
        targetUserId = viewAsId
        setIsImpersonating(true)
      }
    }

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('customer_user_id', targetUserId)
      .single()

    if (!eventData) {
      if (!viewAsId) {
        await supabase.auth.signOut()
        router.push('/')
      }
      return
    }

    setEvent(eventData)

    // Fetch venue via API (service role key bypasses RLS)
    if (eventData.venue_id) {
      try {
        const res = await fetch(`/api/customer/venue-info?venueId=${eventData.venue_id}`)
        if (res.ok) {
          const venueData = await res.json()
          setVenue(venueData)
        }
      } catch (err) {
        console.error('Failed to fetch venue info:', err)
      }
    }
  }

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use impersonated user ID if developer is viewing as customer
      let targetUserId = user.id
      if (viewAsId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'developer') {
          targetUserId = viewAsId
        }
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('customer_user_id', targetUserId)
        .single()

      if (!eventData) return

      setEvent(eventData)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMessages = () => {
    let filtered = [...messages]

    // Trash vs active
    if (filter === 'trash') {
      filtered = filtered.filter(m => m.is_deleted)
    } else {
      filtered = filtered.filter(m => !m.is_deleted)

      if (filter === 'favorites') {
        filtered = filtered.filter(m => m.is_favorite || m.is_favorited)
      }
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        (m.caller_name?.toLowerCase().includes(query)) ||
        (m.notes?.toLowerCase().includes(query))
      )
    }

    // Tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(m =>
        m.tags && selectedTags.some(tag => m.tags!.includes(tag))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.recorded_at || a.created_at).getTime()
      const timeB = new Date(b.recorded_at || b.created_at).getTime()
      const durA = a.duration_seconds || a.duration || 0
      const durB = b.duration_seconds || b.duration || 0

      switch (sortBy) {
        case 'newest': return timeB - timeA
        case 'oldest': return timeA - timeB
        case 'longest': return durB - durA
        case 'shortest': return durA - durB
        default: return 0
      }
    })

    setFilteredMessages(filtered)
  }

  const handlePlay = async (messageId: string, recordingUrl: string) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentlyPlaying === messageId) {
      audio.pause()
      setCurrentlyPlaying(null)
    } else {
      const signedUrl = await getSignedUrl(recordingUrl)
      audio.src = signedUrl
      audio.play()
      setCurrentlyPlaying(messageId)

      audio.onended = () => {
        setCurrentlyPlaying(null)
        setPlaybackProgress(prev => ({ ...prev, [messageId]: 0 }))
      }
    }
  }

  const handleToggleFavorite = async (messageId: string, currentStatus: boolean) => {
    // Optimistic update - show change immediately
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, is_favorite: !currentStatus, is_favorited: !currentStatus } : m
    ))
    try {
      await updateMessage(messageId, { is_favorite: !currentStatus })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert on failure
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, is_favorite: currentStatus, is_favorited: currentStatus } : m
      ))
    }
  }

  const handleSoftDelete = async (messageId: string) => {
    try {
      await updateMessage(messageId, { is_deleted: true, deleted_at: new Date().toISOString() })

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, is_deleted: true } : m
      ))
      setActiveMenu(null)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleRestore = async (messageId: string) => {
    try {
      await updateMessage(messageId, { is_deleted: false, deleted_at: null })

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, is_deleted: false } : m
      ))
    } catch (error) {
      console.error('Error restoring message:', error)
    }
  }

  const handleUpdateGuestName = async (messageId: string) => {
    if (!editNameValue.trim()) {
      setEditingName(null)
      return
    }

    try {
      await updateMessage(messageId, { caller_name: editNameValue.trim() })

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, caller_name: editNameValue.trim() } : m
      ))
      setEditingName(null)
    } catch (error) {
      console.error('Error updating guest name:', error)
    }
  }

  const handleToggleTag = async (messageId: string, tag: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    const currentTags = message.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]

    try {
      await updateMessage(messageId, { tags: newTags })

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, tags: newTags } : m
      ))
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const messageId = photoMessageRef.current
    if (!file || !messageId) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    setPhotoUploading(messageId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('messageId', messageId)

      const res = await fetch('/api/messages/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, guest_photo_url: result.guest_photo_url } : m
      ))
      if (result.signed_url) {
        setPhotoSignedUrls(prev => ({ ...prev, [messageId]: result.signed_url }))
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setPhotoUploading(null)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleDownload = async (recordingUrl: string, guestName: string | null) => {
    try {
      const signedUrl = await getSignedUrl(recordingUrl)
      const response = await fetch(signedUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${guestName || 'message'}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading message:', error)
    }
  }

  const handleShare = async (recordingUrl: string, guestName: string | null) => {
    if (navigator.share) {
      try {
        const signedUrl = await getSignedUrl(recordingUrl)
        const response = await fetch(signedUrl)
        const blob = await response.blob()
        const file = new File([blob], `${guestName || 'message'}.mp3`, { type: 'audio/mpeg' })
        await navigator.share({
          title: `Voice message from ${guestName || 'a guest'}`,
          files: [file]
        })
      } catch (error) {
        // User cancelled share or error
      }
    } else {
      navigator.clipboard.writeText(recordingUrl)
      alert('Link copied to clipboard!')
    }
  }

  const [zipProgress, setZipProgress] = useState<string | null>(null)

  const handleDownloadAll = async () => {
    const activeMessages = messages.filter(m => !m.is_deleted && m.recording_url)
    if (activeMessages.length === 0) return

    try {
      setZipProgress(`Preparing 0/${activeMessages.length}...`)
      const zip = new JSZip()
      const usedNames = new Set<string>()

      for (let i = 0; i < activeMessages.length; i++) {
        const msg = activeMessages[i]
        setZipProgress(`Downloading ${i + 1}/${activeMessages.length}...`)
        try {
          const signedUrl = await getSignedUrl(msg.enhanced_recording_url || msg.recording_url)
          const response = await fetch(signedUrl)
          const blob = await response.blob()
          let baseName = (msg.caller_name || 'message').replace(/[^a-zA-Z0-9\s-]/g, '').trim()
          let fileName = `${baseName}.mp3`
          let counter = 1
          while (usedNames.has(fileName)) {
            fileName = `${baseName} (${counter}).mp3`
            counter++
          }
          usedNames.add(fileName)
          zip.file(fileName, blob)
        } catch (err) {
          console.error(`Failed to download message ${msg.id}:`, err)
        }
      }

      setZipProgress('Creating ZIP file...')
      const eventName = getEventDisplayName().replace(/[^a-zA-Z0-9\s&-]/g, '').trim() || 'messages'
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName} - Voice Messages.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setZipProgress(null)
    } catch (error) {
      console.error('Error creating ZIP:', error)
      setZipProgress(null)
    }
  }

  const getDuration = (m: Message) => m.duration_seconds || m.duration || 0

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDisplayName = (m: Message) => m.caller_name || null

  const getTimestamp = (m: Message) => m.recorded_at || m.created_at

  const isFavorited = (m: Message) => m.is_favorite || m.is_favorited || false

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/customer/login')
  }

  const handleGreetingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) { setGreetingError('Please upload an audio file (MP3 or WAV)'); return }
    if (file.size > 10 * 1024 * 1024) { setGreetingError('File is too large. Maximum size is 10MB.'); return }
    setGreetingUploading(true)
    setGreetingError(null)
    setGreetingSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('greeting', file)
      const response = await fetch(`/api/events/${event?.id}/greeting`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload greeting')
      setGreetingSuccess('Greeting uploaded!')
      setGreetingExpanded(false)
      loadMessages()
      setTimeout(() => setGreetingSuccess(null), 3000)
    } catch (err: any) {
      setGreetingError(err.message || 'Failed to upload greeting')
    } finally {
      setGreetingUploading(false)
      if (greetingFileRef.current) greetingFileRef.current.value = ''
    }
  }

  const formatPhoneDisplay = (phone: string) => {
    // Convert +44... to 0... for UK display
    const national = phone.startsWith('+44') ? '0' + phone.slice(3) : phone
    // Format as 0XXXX XXXXXX
    const digits = national.replace(/\D/g, '')
    if (digits.length === 11) return digits.slice(0, 5) + ' ' + digits.slice(5)
    return national
  }

  const handleCopyNumber = () => {
    const phone = event?.twilio_phone_number
    if (!phone) return
    navigator.clipboard.writeText(formatPhoneDisplay(phone))
    setNumberCopied(true)
    setTimeout(() => setNumberCopied(false), 2000)
  }

  const handleShareNumber = () => {
    const phone = event?.twilio_phone_number
    if (!phone) return
    const displayName = getEventDisplayName()
    const formatted = formatPhoneDisplay(phone)
    if (navigator.share) {
      navigator.share({
        title: `${displayName} Guestbook`,
        text: `Leave a message for ${displayName} by calling ${formatted}`
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`Leave a message for ${displayName} by calling ${formatted}`)
      setNumberCopied(true)
      setTimeout(() => setNumberCopied(false), 2000)
    }
  }

  const getEventDisplayName = () => {
    if (!event) return ''
    const p1 = [event.partner_1_first_name, event.partner_1_last_name].filter(Boolean).join(' ') || event.partner_1_name || ''
    const p2 = [event.partner_2_first_name, event.partner_2_last_name].filter(Boolean).join(' ') || event.partner_2_name || ''

    if (event.event_type === 'wedding') {
      return p2 ? `${p1} & ${p2}` : p1
    }
    return p1
  }

  const getGuestbookTitle = () => {
    if (!event) return { p1: '', p2: '', subtitle: 'Guestbook' }
    const p1First = event.partner_1_first_name || event.partner_1_name?.split(' ')[0] || ''
    const p2First = event.partner_2_first_name || event.partner_2_name?.split(' ')[0] || ''
    const eventType = (event.event_type || 'event').charAt(0).toUpperCase() + (event.event_type || 'event').slice(1)
    return {
      p1: p1First,
      p2: p2First,
      subtitle: `${eventType} Guestbook`,
    }
  }

  const activeMessageCount = messages.filter(m => !m.is_deleted).length
  const favCount = messages.filter(m => !m.is_deleted && isFavorited(m)).length
  const trashCount = messages.filter(m => m.is_deleted).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFEFEF' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading your messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFEFEF' }}>
      {isImpersonating && event && (
        <ImpersonationBanner 
          label={`${event.partner_1_first_name}${event.partner_2_first_name ? ` & ${event.partner_2_first_name}` : ''}'s ${event.event_type || 'Event'}`} 
          type="customer" 
        />
      )}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Oooh+Baby&display=swap" rel="stylesheet" />
      {/* Hidden file input for photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Header */}
      <header style={{ background: '#FFEFEF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          {/* Mobile: icons top-right, logo centered below */}
          <div className="sm:hidden">
            <div className="flex justify-end gap-2 mb-2">
              <Link
                href="/customer/settings"
                className="p-2 rounded-lg hover:bg-white/50 transition"
                title="Settings"
              >
                <Settings size={18} style={{ color: '#8B9B8E' }} />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-white/50 transition"
                title="Sign out"
              >
                <LogOut size={18} style={{ color: '#8B9B8E' }} />
              </button>
            </div>
            <div className="flex justify-center">
              {venue?.logo_url ? (
                <img 
                  src={venue.logo_url} 
                  alt={venue.name || 'Venue'}
                  className="h-14 w-auto object-contain"
                />
              ) : venue?.name ? (
                <span className="text-base font-medium" style={{ color: '#3D5A4C' }}>
                  {venue.name}
                </span>
              ) : null}
            </div>
          </div>

          {/* Desktop: logo left, icons right */}
          <div className="hidden sm:flex justify-between items-center">
            <div className="flex items-center gap-3">
              {venue?.logo_url ? (
                <img 
                  src={venue.logo_url} 
                  alt={venue.name || 'Venue'}
                  className="h-14 w-auto object-contain"
                />
              ) : venue?.name ? (
                <span className="text-base font-medium" style={{ color: '#3D5A4C' }}>
                  {venue.name}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              {getEventDisplayName() && (
                <span className="text-sm font-medium" style={{ color: '#3D5A4C' }}>
                  {getEventDisplayName()}
                </span>
              )}
              <Link
                href="/customer/settings"
                className="p-2 rounded-lg hover:bg-white/50 transition"
                title="Settings"
              >
                <Settings size={20} style={{ color: '#8B9B8E' }} />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-white/50 transition"
                title="Sign out"
              >
                <LogOut size={20} style={{ color: '#8B9B8E' }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 text-center">
          {(() => {
            const title = getGuestbookTitle()
            return (
              <h1>
                {title.p1 && (
                  <span className="block leading-none" style={{ fontFamily: "'Florentea', cursive", color: '#1a1a1a' }}>
                    {title.p2 ? (
                      <>
                        {/* Mobile: stacked layout */}
                        <span className="sm:hidden">
                          <span className="block text-7xl">{title.p1}</span>
                          <span className="block text-xl my-0" style={{ lineHeight: '1.4' }}>&amp;</span>
                          <span className="block text-7xl">{title.p2}&rsquo;s</span>
                        </span>
                        {/* Desktop: inline layout */}
                        <span className="hidden sm:block text-8xl">
                          {title.p1} <span className="text-2xl">&amp;</span> {title.p2}&rsquo;s
                        </span>
                      </>
                    ) : (
                      <span className="block text-7xl sm:text-8xl">{title.p1}&rsquo;s</span>
                    )}
                  </span>
                )}
                <span className="block font-serif text-2xl sm:text-4xl mt-4 sm:mt-5" style={{ color: '#4a4a4a' }}>{title.subtitle}</span>
              </h1>
            )
          })()}
          <p className="text-sage-dark mt-2">
            {activeMessageCount} message{activeMessageCount !== 1 ? 's' : ''} from your special day
          </p>
        </div>

        {/* Greeting Card - shown as green bar only when messages exist */}
        {event && activeMessageCount > 0 && (
          <div className="mb-6">
            <GreetingCard
              eventId={event.id}
              greetingAudioUrl={event.greeting_audio_url}
              greetingText={event.greeting_text}
              onUpdate={loadMessages}
            />
          </div>
        )}

        {/* Filter Bar - hidden when no messages */}
        {activeMessageCount > 0 && <div className="mb-6">
          {/* Mobile: compact bar */}
          <div className="flex sm:hidden items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #e8ece9' }}>
                <button
                  onClick={() => setViewMode('cards')}
                  className="p-2 transition"
                  style={{
                    background: viewMode === 'cards' ? '#3D5A4C' : 'white',
                    color: viewMode === 'cards' ? 'white' : '#8B9B8E',
                  }}
                >
                  <Layers size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('tiles')}
                  className="p-2 transition"
                  style={{
                    background: viewMode === 'tiles' ? '#3D5A4C' : 'white',
                    color: viewMode === 'tiles' ? 'white' : '#8B9B8E',
                  }}
                >
                  <LayoutGrid size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Filter tab pills (compact) */}
              <div className="flex items-center gap-0.5">
                {(['all', 'favorites', 'trash'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                    style={{
                      background: filter === f ? '#3D5A4C' : 'transparent',
                      color: filter === f ? 'white' : '#8B9B8E',
                    }}
                  >
                    {f === 'all' ? `All (${activeMessageCount})` : f === 'favorites' ? `${favCount}` : `Bin`}
                    {f === 'favorites' && <Heart size={10} className="inline ml-0.5 -mt-0.5" fill={filter === 'favorites' ? 'white' : 'none'} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter expand button */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="relative p-2 rounded-lg transition"
              style={{ color: mobileFiltersOpen || selectedTags.length > 0 || searchQuery ? '#3D5A4C' : '#8B9B8E' }}
            >
              <SlidersHorizontal size={18} strokeWidth={1.5} />
              {(selectedTags.length > 0 || searchQuery) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#D4A5A5' }} />
              )}
            </button>
          </div>

          {/* Mobile: expanded filters */}
          {mobileFiltersOpen && (
            <div className="sm:hidden py-3 space-y-3" style={{ borderTop: '1px solid #e8ece9' }}>
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
                <input
                  type="text"
                  placeholder="Search by name or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: '#e8ece9', color: '#1a1a1a' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-sage" />
                  </button>
                )}
              </div>

              {/* Sort + Tags + Download row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition"
                    style={{ borderColor: '#e8ece9', color: '#6E7D71' }}
                  >
                    <Filter size={13} />
                    {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'longest' ? 'Longest' : 'Shortest'}
                    <ChevronDown size={12} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20" style={{ border: '1px solid #e8ece9', minWidth: '120px' }}>
                      {(['newest', 'oldest', 'longest', 'shortest'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setShowSortMenu(false) }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-sage-light/20 transition flex items-center justify-between"
                          style={{ color: sortBy === opt ? '#3D5A4C' : '#6E7D71' }}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          {sortBy === opt && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition"
                  style={{
                    borderColor: showFilters || selectedTags.length > 0 ? '#3D5A4C' : '#e8ece9',
                    color: showFilters || selectedTags.length > 0 ? '#3D5A4C' : '#6E7D71',
                  }}
                >
                  <Tag size={13} />
                  Tags
                  {selectedTags.length > 0 && <span className="font-bold">{selectedTags.length}</span>}
                </button>

                {activeMessageCount > 0 && filter !== 'trash' && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={!!zipProgress}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{ background: '#D4A5A5', color: 'white', opacity: zipProgress ? 0.7 : 1 }}
                  >
                    <Download size={13} />
                    {zipProgress || 'Download All'}
                  </button>
                )}
              </div>

              {/* Tags (if open) */}
              {showFilters && (
                <div className="pt-2" style={{ borderTop: '1px solid #e8ece9' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-sage-dark uppercase tracking-wider">Filter by tag</p>
                    {selectedTags.length > 0 && (
                      <button onClick={() => setSelectedTags([])} className="text-xs text-sage-dark hover:text-deep-green transition">Clear all</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
                          else setSelectedTags([...selectedTags, tag])
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                        style={{
                          background: selectedTags.includes(tag) ? '#3D5A4C' : '#f5f0e8',
                          color: selectedTags.includes(tag) ? 'white' : '#6E7D71'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop: full filter bar (unchanged) */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm" style={{ border: '1px solid #e8ece9' }}>
            <div className="p-4">
              <div className="flex flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setFilter('all')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: filter === 'all' ? '#3D5A4C' : 'transparent', color: filter === 'all' ? 'white' : '#6E7D71' }}
                  >
                    <MessageCircle size={16} />
                    All ({activeMessageCount})
                  </button>
                  <button
                    onClick={() => setFilter('favorites')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: filter === 'favorites' ? '#3D5A4C' : 'transparent', color: filter === 'favorites' ? 'white' : '#6E7D71' }}
                  >
                    <Heart size={16} />
                    Favourites ({favCount})
                  </button>
                  <button
                    onClick={() => setFilter('trash')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: filter === 'trash' ? '#3D5A4C' : 'transparent', color: filter === 'trash' ? 'white' : '#6E7D71' }}
                  >
                    <Trash2 size={16} />
                    Bin ({trashCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View toggle */}
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #e8ece9' }}>
                    <button
                      onClick={() => setViewMode('cards')}
                      className="p-2 transition"
                      style={{ background: viewMode === 'cards' ? '#3D5A4C' : 'white', color: viewMode === 'cards' ? 'white' : '#8B9B8E' }}
                      title="Card view"
                    >
                      <Layers size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setViewMode('tiles')}
                      className="p-2 transition"
                      style={{ background: viewMode === 'tiles' ? '#3D5A4C' : 'white', color: viewMode === 'tiles' ? 'white' : '#8B9B8E' }}
                      title="Grid view"
                    >
                      <LayoutGrid size={16} strokeWidth={1.5} />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition"
                    style={{
                      borderColor: showFilters || selectedTags.length > 0 ? '#3D5A4C' : '#e8ece9',
                      color: showFilters || selectedTags.length > 0 ? '#3D5A4C' : '#6E7D71',
                      background: selectedTags.length > 0 ? '#3D5A4C0D' : 'white'
                    }}
                  >
                    <Tag size={16} />
                    Tags
                    {selectedTags.length > 0 && <span className="text-xs font-bold" style={{ color: '#3D5A4C' }}>{selectedTags.length}</span>}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition"
                      style={{ borderColor: '#e8ece9', color: '#6E7D71' }}
                    >
                      <Filter size={16} />
                      {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'longest' ? 'Longest' : 'Shortest'}
                      <ChevronDown size={14} />
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20" style={{ border: '1px solid #e8ece9', minWidth: '140px' }}>
                        {(['newest', 'oldest', 'longest', 'shortest'] as const).map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setSortBy(opt); setShowSortMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center justify-between"
                            style={{ color: sortBy === opt ? '#3D5A4C' : '#6E7D71' }}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            {sortBy === opt && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeMessageCount > 0 && filter !== 'trash' && (
                    <button
                      onClick={handleDownloadAll}
                      disabled={!!zipProgress}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                      style={{ background: '#D4A5A5', color: 'white', opacity: zipProgress ? 0.7 : 1 }}
                    >
                      <Download size={16} />
                      {zipProgress || 'Download All'}
                    </button>
                  )}

                  {/* Inline search */}
                  <div className="relative flex items-center">
                    {desktopSearchOpen ? (
                      <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 transition-all" style={{ borderColor: '#3D5A4C', minWidth: '220px' }}>
                        <Search size={15} style={{ color: '#8B9B8E', flexShrink: 0 }} />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-sm focus:outline-none bg-transparent w-full"
                          style={{ color: '#1a1a1a' }}
                          autoFocus
                        />
                        <button
                          onClick={() => { setSearchQuery(''); setDesktopSearchOpen(false) }}
                          className="flex-shrink-0"
                        >
                          <X size={14} style={{ color: '#8B9B8E' }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDesktopSearchOpen(true)}
                        className="relative p-2 rounded-lg border transition hover:bg-sage-light/10"
                        style={{ borderColor: searchQuery ? '#3D5A4C' : '#e8ece9', color: searchQuery ? '#3D5A4C' : '#6E7D71' }}
                      >
                        <Search size={16} />
                        {searchQuery && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#D4A5A5' }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop tags */}
              {showFilters && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e8ece9' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-sage-dark uppercase tracking-wider">Filter by tag</p>
                    {selectedTags.length > 0 && (
                      <button onClick={() => setSelectedTags([])} className="text-xs text-sage-dark hover:text-deep-green transition">Clear all</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
                          else setSelectedTags([...selectedTags, tag])
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                        style={{
                          background: selectedTags.includes(tag) ? '#3D5A4C' : '#f5f0e8',
                          color: selectedTags.includes(tag) ? 'white' : '#6E7D71'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>}

        {/* Messages Display */}
        {filteredMessages.length === 0 ? (
          filter === 'all' && !searchQuery && selectedTags.length === 0 ? (
            /* Two overlapping parchment cards — countdown + greeting */
            <div>
              <style>{`
                .empty-parchment {
                  background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
                }
                .empty-parchment.parchment-primary {
                  box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 6px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.09), inset 0 0 60px rgba(255,252,240,0.5);
                }
                .empty-parchment.parchment-secondary {
                  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 3px 6px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.05), inset 0 0 60px rgba(255,252,240,0.5);
                }
                .empty-parchment::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  background-image:
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65 0.2' numOctaves='4' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E"),
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02 0.4' numOctaves='2' seed='8' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
                  opacity: 0.03;
                  mix-blend-mode: multiply;
                  pointer-events: none;
                }
                .empty-parchment::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  border: 1px solid rgba(180, 165, 140, 0.25);
                  pointer-events: none;
                }
                .parchment-cards-row {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0;
                  padding: 2rem 0;
                }
                @media (max-width: 640px) {
                  .parchment-cards-row {
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.5rem 0;
                  }
                  .parchment-card-1 {
                    transform: rotate(-1.5deg) !important;
                    margin-right: 0 !important;
                  }
                  .parchment-card-2 {
                    transform: rotate(1deg) translateY(0) !important;
                    margin-left: 0 !important;
                    margin-top: -0.5rem !important;
                    width: 290px !important;
                  }
                }
              `}</style>
              <div className="parchment-cards-row">
                {/* Card 1: Countdown */}
                <div
                  className="empty-parchment parchment-primary parchment-card-1"
                  style={{
                    position: 'relative',
                    width: '320px',
                    maxWidth: '85%',
                    borderRadius: '1rem',
                    padding: '2.25rem 2rem',
                    textAlign: 'center',
                    transform: 'rotate(-2.5deg)',

                    marginRight: '-1rem',
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    {(() => {
                      if (!event?.event_date) return <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', color: '#6E7D71' }}>Your Big Day</span>
                      const eventDate = new Date(event.event_date + 'T00:00:00')
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const diffMs = eventDate.getTime() - today.getTime()
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      if (diffDays > 1) return (
                        <>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '4.5rem', fontWeight: 300, color: '#3D5A4C', lineHeight: 1 }}>{diffDays}</div>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1rem', color: '#8a8a7a', marginTop: '0.25rem' }}>days to go</div>
                        </>
                      )
                      if (diffDays === 1) return (
                        <>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '4.5rem', fontWeight: 300, color: '#3D5A4C', lineHeight: 1 }}>1</div>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1rem', color: '#8a8a7a', marginTop: '0.25rem' }}>day to go</div>
                        </>
                      )
                      if (diffDays === 0) return <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', color: '#3D5A4C' }}>Today</span>
                      return <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', color: '#6E7D71' }}>Your Big Day</span>
                    })()}
                  </div>

                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '0.95rem',
                    color: '#8a8a7a',
                    lineHeight: 1.6
                  }}>
                    {(() => {
                      const eventType = event?.event_type === 'wedding' ? 'wedding' : 'event'
                      if (!event?.event_date) return 'Your messages will appear here.'
                      const eventDate = new Date(event.event_date + 'T00:00:00')
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const diffMs = eventDate.getTime() - today.getTime()
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      if (diffDays > 0) return `Your messages will appear here after your ${eventType}.`
                      return 'Your messages will appear here as guests call in.'
                    })()}
                  </div>

                  {event?.event_date && (
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '0.85rem',
                      color: '#a0a090',
                      letterSpacing: '0.05em'
                    }}>
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                {/* Card 2: Greeting — self-contained */}
                <div
                  className="empty-parchment parchment-secondary parchment-card-2"
                  style={{
                    position: 'relative',
                    width: '290px',
                    maxWidth: '80%',
                    borderRadius: '0.9rem',
                    padding: '1.75rem 1.75rem 1.75rem 2.25rem',
                    textAlign: 'center',
                    transform: 'rotate(2deg) translateY(14px)',
                    marginLeft: '0rem',
                    zIndex: 2,
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    fontFamily: "'Oooh Baby', cursive",
                    fontSize: '1.6rem',
                    color: '#3D5A4C',
                    lineHeight: 1.3,
                    marginBottom: '0.5rem'
                  }}>
                    Your Personal Audio Greeting
                  </div>

                  {event?.greeting_audio_url ? (
                    /* Tier 1: User-uploaded custom greeting */
                    <>
                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.95rem',
                        color: '#6E7D71',
                        marginBottom: '0.75rem',
                        lineHeight: 1.6
                      }}>
                        Your greeting is ready.
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0' }}>
                        <button
                          onClick={() => {
                            const audio = document.getElementById('parchment-greeting-audio') as HTMLAudioElement
                            if (audio) {
                              if (audio.paused) { audio.src = event.greeting_audio_url; audio.play() }
                              else { audio.pause(); audio.currentTime = 0 }
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.55rem 1rem',
                            background: '#3D5A4C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Play size={14} fill="white" stroke="white" /> Listen
                        </button>
                        <button
                          onClick={() => setGreetingExpanded(!greetingExpanded)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.55rem 1rem',
                            background: 'transparent',
                            color: '#6E7D71',
                            border: '1px solid rgba(0,0,0,0.12)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={14} /> Edit Greeting
                        </button>
                      </div>
                      <audio id="parchment-greeting-audio" className="hidden" />

                      {/* Inline upload area */}
                      {greetingExpanded && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <input
                            ref={greetingFileRef}
                            type="file"
                            accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav"
                            className="hidden"
                            onChange={handleGreetingUpload}
                          />
                          <button
                            onClick={() => greetingFileRef.current?.click()}
                            disabled={greetingUploading}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto',
                              fontSize: '0.85rem',
                              padding: '0.55rem 1rem',
                              background: '#3D5A4C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              opacity: greetingUploading ? 0.6 : 1,
                            }}
                          >
                            <Upload size={14} />
                            {greetingUploading ? 'Uploading...' : 'Choose File (MP3 / WAV)'}
                          </button>
                          {greetingError && <p style={{ color: '#c45', fontSize: '0.8rem', marginTop: '0.75rem' }}>{greetingError}</p>}
                          {greetingSuccess && <p style={{ color: '#3D5A4C', fontSize: '0.8rem', marginTop: '0.75rem' }}>{greetingSuccess}</p>}
                        </div>
                      )}
                    </>
                  ) : event?.ai_greeting_audio_url ? (
                    /* Tier 2: AI-generated greeting exists — encourage personal recording */
                    <>
                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.88rem',
                        color: '#8a8a7a',
                        marginBottom: '0.75rem',
                        lineHeight: 1.6
                      }}>
                        We've created a greeting for you automatically. For a personal touch, we'd recommend recording your own.
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0' }}>
                        <button
                          onClick={() => {
                            const audio = document.getElementById('parchment-greeting-audio') as HTMLAudioElement
                            if (audio) {
                              if (audio.paused) { audio.src = event.ai_greeting_audio_url; audio.play() }
                              else { audio.pause(); audio.currentTime = 0 }
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.55rem 1rem',
                            background: 'transparent',
                            color: '#6E7D71',
                            border: '1px solid rgba(0,0,0,0.12)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Play size={14} /> Preview
                        </button>
                        <button
                          onClick={() => setGreetingExpanded(!greetingExpanded)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.55rem 1rem',
                            background: '#3D5A4C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={14} /> Record Your Own
                        </button>
                      </div>
                      <audio id="parchment-greeting-audio" className="hidden" />

                      {/* Inline upload area */}
                      {greetingExpanded && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <input
                            ref={greetingFileRef}
                            type="file"
                            accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav"
                            className="hidden"
                            onChange={handleGreetingUpload}
                          />
                          <button
                            onClick={() => greetingFileRef.current?.click()}
                            disabled={greetingUploading}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto',
                              fontSize: '0.85rem',
                              padding: '0.55rem 1rem',
                              background: '#3D5A4C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              opacity: greetingUploading ? 0.6 : 1,
                            }}
                          >
                            <Upload size={14} />
                            {greetingUploading ? 'Uploading...' : 'Choose File (MP3 / WAV)'}
                          </button>
                          <p style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: '0.8rem',
                            color: '#a0a090',
                            marginTop: '0.75rem',
                            lineHeight: 1.5
                          }}>
                            MP3 or WAV · Under 10MB · Keep it under 30 seconds
                          </p>
                          {greetingError && <p style={{ color: '#c45', fontSize: '0.8rem', marginTop: '0.5rem' }}>{greetingError}</p>}
                          {greetingSuccess && <p style={{ color: '#3D5A4C', fontSize: '0.8rem', marginTop: '0.5rem' }}>{greetingSuccess}</p>}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Tier 3: No greeting at all */
                    <>
                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.9rem',
                        color: '#8a8a7a',
                        marginBottom: '0.9rem',
                        lineHeight: 1.6
                      }}>
                        Record a greeting for your guests to hear when they call.
                      </div>

                      {!greetingExpanded ? (
                        <button
                          onClick={() => setGreetingExpanded(true)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.6rem 1.25rem',
                            background: '#3D5A4C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={14} /> Upload Greeting
                        </button>
                      ) : (
                        <div>
                          <input
                            ref={greetingFileRef}
                            type="file"
                            accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav"
                            className="hidden"
                            onChange={handleGreetingUpload}
                          />
                          <button
                            onClick={() => greetingFileRef.current?.click()}
                            disabled={greetingUploading}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                              fontSize: '0.85rem',
                              padding: '0.6rem 1.25rem',
                              background: '#3D5A4C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              opacity: greetingUploading ? 0.6 : 1,
                            }}
                          >
                            <Upload size={14} />
                            {greetingUploading ? 'Uploading...' : 'Choose File (MP3 / WAV)'}
                          </button>
                          <p style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: '0.8rem',
                            color: '#a0a090',
                            marginTop: '1rem',
                            lineHeight: 1.5
                          }}>
                            MP3 or WAV · Under 10MB · Keep it under 30 seconds
                          </p>
                          {greetingError && <p style={{ color: '#c45', fontSize: '0.8rem', marginTop: '0.5rem' }}>{greetingError}</p>}
                          {greetingSuccess && <p style={{ color: '#3D5A4C', fontSize: '0.8rem', marginTop: '0.5rem' }}>{greetingSuccess}</p>}
                        </div>
                      )}
                    </>
                  )}

                  {/* Divider + Guestbook Number */}
                  {event?.twilio_phone_number && (
                    <>
                      <div style={{
                        margin: '0.9rem 0 0.75rem',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(180,165,140,0.18) 30%, rgba(180,165,140,0.18) 70%, transparent 100%)',
                      }} />

                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.85rem',
                        color: '#8a8a7a',
                        letterSpacing: '0.03em',
                        marginBottom: '0.5rem',
                      }}>
                        Share Your Guestbook Number
                      </div>

                      <p style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.82rem',
                        color: '#8a8a7a',
                        lineHeight: 1.55,
                        marginBottom: '0.65rem',
                      }}>
                        Guests who can't make the big day can still leave their message by calling this number.
                      </p>

                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '1.3rem',
                        fontWeight: 400,
                        color: '#3D5A4C',
                        letterSpacing: '0.12em',
                        marginBottom: '0.6rem',
                      }}>
                        {formatPhoneDisplay(event.twilio_phone_number)}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={handleCopyNumber}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.78rem',
                            padding: '0.4rem 0.9rem',
                            background: 'transparent',
                            color: numberCopied ? '#3D5A4C' : '#9a9a8a',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {numberCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Number</>}
                        </button>
                        <button
                          onClick={handleShareNumber}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.78rem',
                            padding: '0.4rem 0.9rem',
                            background: 'transparent',
                            color: '#9a9a8a',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '2rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Share2 size={12} /> Share
                        </button>
                      </div>

                      <p style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.72rem',
                        color: '#a8a898',
                        marginTop: '0.6rem',
                        lineHeight: 1.5,
                      }}>
                        Share it with friends and family who can't attend in person.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center" style={{ border: '1px solid #e8ece9' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#f5f0e8' }}>
              {filter === 'trash' ? (
                <Trash2 size={28} className="text-sage" />
              ) : filter === 'favorites' ? (
                <Heart size={28} className="text-sage" />
              ) : (
                <MessageCircle size={28} className="text-sage" />
              )}
            </div>
            <p className="text-lg font-medium mb-1" style={{ color: '#1a1a1a' }}>
              {filter === 'trash'
                ? 'Bin is empty'
                : filter === 'favorites'
                  ? 'No favourites yet'
                  : searchQuery || selectedTags.length > 0
                    ? 'No messages match your filters'
                    : 'No messages yet'
              }
            </p>
            <p className="text-sm text-sage-dark">
              {filter === 'trash'
                ? 'Deleted messages will appear here'
                : filter === 'favorites'
                  ? 'Tap the heart icon on messages to add them here'
                  : searchQuery || selectedTags.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Messages will appear here as guests call in'
              }
            </p>
          </div>
          )
        ) : viewMode === 'cards' ? (
          <MessageCardStack
            messages={filteredMessages}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
            onSoftDelete={handleSoftDelete}
            onRestore={handleRestore}
            onUpdateName={(messageId, name) => {
              updateMessage(messageId, { caller_name: name }).then(() => {
                setMessages(msgs => msgs.map(m => m.id === messageId ? { ...m, caller_name: name } : m))
              })
            }}
            onToggleTag={handleToggleTag}
            onDownload={handleDownload}
            onShare={handleShare}
            onPhotoUpload={(messageId) => {
              photoMessageRef.current = messageId
              photoInputRef.current?.click()
            }}
            currentlyPlaying={currentlyPlaying}
            playbackProgress={playbackProgress}
            filter={filter}
            photoSignedUrls={photoSignedUrls}
          />
        ) : (
          <>
            <style>{`
              .parchment-tile {
                background: linear-gradient(145deg, #FFFEF7 0%, #FBF8F0 25%, #F8F4E8 50%, #FBF7ED 75%, #FFFDF5 100%);
                box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07);
                position: relative;
              }
              .parchment-tile::before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                background-image:
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65 0.2' numOctaves='4' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E"),
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02 0.4' numOctaves='2' seed='8' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
                opacity: 0.03;
                mix-blend-mode: multiply;
                pointer-events: none;
              }
              .parchment-tile::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid rgba(180, 165, 140, 0.25);
                pointer-events: none;
              }
              .tile-photo-frame {
                background: white;
                padding: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.06);
                border-radius: 3px;
              }
              .tile-card-name { font-family: 'Oooh Baby', cursive; color: #1a1a1a; }
            `}</style>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {filteredMessages.map((message, index) => {
                const name = getDisplayName(message)
                const duration = getDuration(message)
                const timestamp = getTimestamp(message)
                const fav = isFavorited(message)
                const progress = playbackProgress[message.id] || 0
                const isPlaying = currentlyPlaying === message.id
                const seed = index * 2654435761
                const rotation = ((seed % 600) - 300) / 100
                const photoUrl = message.guest_photo_url
                  ? (message.guest_photo_url.startsWith('http') ? message.guest_photo_url : photoSignedUrls[message.id])
                  : null

                return (
                  <div
                    key={message.id}
                    className="parchment-tile rounded-xl"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${rotation}deg)`)}
                  >
                    <div className="relative z-10 p-4">
                      {/* Photo */}
                      <div className="mb-3">
                        {photoUrl ? (
                          <div className="tile-photo-frame">
                            <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '2px' }}>
                              <img src={photoUrl} alt={name || 'Guest'} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { if (filter !== 'trash') { photoMessageRef.current = message.id; photoInputRef.current?.click() } }}
                            className="w-full"
                          >
                            <div className="tile-photo-frame">
                              <div
                                className="flex flex-col items-center justify-center gap-2"
                                style={{ aspectRatio: '4/3', background: '#f0ece4', borderRadius: '2px' }}
                              >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                  <ImageIcon size={20} style={{ color: '#999' }} />
                                </div>
                                <span className="text-xs" style={{ color: '#999' }}>Tap to add photo</span>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          {editingName === message.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateGuestName(message.id)
                                  if (e.key === 'Escape') setEditingName(null)
                                }}
                                className="text-xl px-2 py-1 rounded border focus:outline-none focus:ring-2 w-full"
                                style={{ fontFamily: "'Oooh Baby', cursive", borderColor: '#ddd', color: '#1a1a1a' }}
                                autoFocus
                              />
                              <button onClick={() => handleUpdateGuestName(message.id)} className="p-1 rounded hover:bg-black/5">
                                <Check size={14} style={{ color: '#333' }} />
                              </button>
                              <button onClick={() => setEditingName(null)} className="p-1 rounded hover:bg-black/5">
                                <X size={14} style={{ color: '#999' }} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { if (filter !== 'trash') { setEditingName(message.id); setEditNameValue(name || '') } }}
                              className="text-left w-full"
                            >
                              <p className="tile-card-name text-xl sm:text-2xl truncate">
                                {name || (
                                  <span className="italic text-base flex items-center gap-1" style={{ fontFamily: 'inherit', color: '#aaa' }}>
                                    <User size={14} /> Tap to add name
                                  </span>
                                )}
                              </p>
                            </button>
                          )}
                        </div>

                        {filter !== 'trash' && (
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                              className="p-1.5 rounded-lg hover:bg-black/5 transition"
                            >
                              <MoreHorizontal size={16} style={{ color: '#999' }} />
                            </button>
                            {activeMenu === message.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20" style={{ border: '1px solid #e0e0e0', minWidth: '160px' }}>
                                  <button onClick={() => { photoMessageRef.current = message.id; photoInputRef.current?.click(); setActiveMenu(null) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2" style={{ color: '#555' }}>
                                    <ImageIcon size={14} /> {message.guest_photo_url ? 'Change photo' : 'Add photo'}
                                  </button>
                                  <button onClick={() => { handleShare(message.enhanced_recording_url || message.recording_url, name); setActiveMenu(null) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2" style={{ color: '#555' }}>
                                    <Share2 size={14} /> Share
                                  </button>
                                  <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                                  <button onClick={() => handleSoftDelete(message.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition flex items-center gap-2" style={{ color: '#C08585' }}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date + duration */}
                      <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: '#777' }}>
                        <span>{new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span style={{ color: '#ccc' }}>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} style={{ color: '#999' }} /> {formatDuration(duration)}
                        </span>
                      </div>

                      {/* Play + progress */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePlay(message.id, message.enhanced_recording_url || message.recording_url)}
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: isPlaying ? '#D4A5A5' : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                        >
                          {isPlaying ? <Pause size={16} fill="white" stroke="white" /> : <Play size={16} fill="white" stroke="white" style={{ marginLeft: '2px' }} />}
                        </button>
                        <div className="flex-1">
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isPlaying ? '#D4A5A5' : '#333' }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-mono" style={{ color: '#999' }}>{formatDuration(duration)}</span>
                      </div>

                      {/* Divider */}
                      <div className="my-3" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent 100%)' }} />

                      {/* Bottom bar */}
                      <div className="flex items-center justify-between">
                        {filter === 'trash' ? (
                          <button onClick={() => handleRestore(message.id)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#333' }}>
                            <Undo2 size={14} /> Restore
                          </button>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                              <button onClick={() => handleToggleFavorite(message.id, fav)} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition">
                                <Heart size={16} fill={fav ? '#C08585' : 'none'} stroke={fav ? '#C08585' : '#bbb'} strokeWidth={1.5} />
                              </button>
                              <button onClick={() => setTagMenuOpen(tagMenuOpen === message.id ? null : message.id)} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition" title="Edit tags">
                                <Tag size={14} style={{ color: '#999' }} />
                              </button>
                              {message.tags && message.tags.length > 0 && tagMenuOpen !== message.id && (
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                  {message.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: 'rgba(0,0,0,0.05)', color: '#666', border: '1px solid rgba(0,0,0,0.08)' }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => handleDownload(message.enhanced_recording_url || message.recording_url, name)} className="p-1.5 rounded-lg hover:bg-black/5 transition" title="Download">
                                <Download size={14} style={{ color: '#999' }} />
                              </button>
                              <button onClick={() => handleShare(message.enhanced_recording_url || message.recording_url, name)} className="p-1.5 rounded-lg hover:bg-black/5 transition" title="Share">
                                <Share2 size={14} style={{ color: '#999' }} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Tag editor */}
                      {tagMenuOpen === message.id && (
                        <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
                          <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_TAGS.map(tag => (
                              <button
                                key={tag}
                                onClick={() => handleToggleTag(message.id, tag)}
                                className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                                style={{
                                  background: (message.tags || []).includes(tag) ? '#333' : 'white',
                                  color: (message.tags || []).includes(tag) ? 'white' : '#666',
                                  border: '1px solid',
                                  borderColor: (message.tags || []).includes(tag) ? '#333' : '#ddd'
                                }}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setTagMenuOpen(null)} className="mt-2 text-xs font-medium" style={{ color: '#333' }}>Done</button>
                        </div>
                      )}

                      {/* Photo uploading */}
                      {photoUploading === message.id && (
                        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#999' }}>
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Uploading photo...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-10 border-t border-sage-light/30">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm text-sage-dark/70 tracking-wider uppercase font-light">Powered by</span>
          <img src="/logo.png" alt="WeddingRingRing" className="h-10 w-auto" />
        </div>
      </footer>

      {/* Click outside to close menus */}
      {showSortMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowSortMenu(false)}></div>
      )}
    </div>
  )
}
