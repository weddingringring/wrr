'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import GreetingCard from './GreetingCard'
import {
  Play, Pause, Heart, Download, Share2, Search,
  Filter, X, Trash2, Tag, Clock, Phone, User,
  Star, Music, ChevronDown, MoreHorizontal,
  Image as ImageIcon, Upload, Check, Undo2,
  Archive, Settings, LogOut, MessageCircle
} from 'lucide-react'

interface Message {
  id: string
  caller_number: string
  recording_url: string
  duration_seconds: number
  duration: number
  created_at: string
  recorded_at: string
  is_favorite: boolean
  is_favorited: boolean
  guest_name: string | null
  caller_name: string | null
  notes: string | null
  tags: string[] | null
  photo_url: string | null
  is_deleted: boolean
}

const AVAILABLE_TAGS = [
  'Family', 'Friends', 'Funny', 'Emotional', 'Heartfelt',
  'Work colleagues', 'Surprise', 'Drunk 😂', 'Kids'
]

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'trash'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoMessageRef = useRef<string | null>(null)

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
      router.push('/customer/login')
      return
    }

    const { data: eventData } = await supabase
      .from('events')
      .select('*, venue:venues(name)')
      .eq('customer_user_id', user.id)
      .single()

    if (!eventData) {
      await supabase.auth.signOut()
      router.push('/customer/login')
      return
    }

    setEvent(eventData)
  }

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('customer_user_id', user.id)
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
        (m.guest_name?.toLowerCase().includes(query)) ||
        (m.caller_name?.toLowerCase().includes(query)) ||
        (m.notes?.toLowerCase().includes(query)) ||
        (m.caller_number?.includes(query))
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
      audio.src = recordingUrl
      audio.play()
      setCurrentlyPlaying(messageId)

      audio.onended = () => {
        setCurrentlyPlaying(null)
        setPlaybackProgress(prev => ({ ...prev, [messageId]: 0 }))
      }
    }
  }

  const handleToggleFavorite = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_favorite: !currentStatus })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, is_favorite: !currentStatus, is_favorited: !currentStatus } : m
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleSoftDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)

      if (error) throw error

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
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: false })
        .eq('id', messageId)

      if (error) throw error

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
      const { error } = await supabase
        .from('messages')
        .update({ guest_name: editNameValue.trim() })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, guest_name: editNameValue.trim() } : m
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
      const { error } = await supabase
        .from('messages')
        .update({ tags: newTags })
        .eq('id', messageId)

      if (error) throw error

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
      const ext = file.name.split('.').pop()
      const fileName = `${messageId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('message-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('message-photos')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('messages')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', messageId)

      if (updateError) throw updateError

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, photo_url: urlData.publicUrl } : m
      ))
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
      const response = await fetch(recordingUrl)
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
        const response = await fetch(recordingUrl)
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

  const handleDownloadAll = async () => {
    const activeMessages = messages.filter(m => !m.is_deleted && m.recording_url)
    if (activeMessages.length === 0) return

    for (const msg of activeMessages) {
      await handleDownload(msg.recording_url, msg.guest_name || msg.caller_name)
    }
  }

  const getDuration = (m: Message) => m.duration_seconds || m.duration || 0

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDisplayName = (m: Message) => m.guest_name || m.caller_name || null

  const getTimestamp = (m: Message) => m.recorded_at || m.created_at

  const isFavorited = (m: Message) => m.is_favorite || m.is_favorited || false

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/customer/login')
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

  const activeMessageCount = messages.filter(m => !m.is_deleted).length
  const favCount = messages.filter(m => !m.is_deleted && isFavorited(m)).length
  const trashCount = messages.filter(m => m.is_deleted).length

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-dark">Loading your messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hidden file input for photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e8ece9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="WeddingRingRing" className="h-10" />
              {getEventDisplayName() && (
                <>
                  <div style={{ width: '1px', height: '24px', background: '#d1d5db' }}></div>
                  <p className="text-sm font-medium" style={{ color: '#3D5A4C' }}>
                    {getEventDisplayName()}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/customer/settings"
                className="p-2 rounded-lg hover:bg-sage-light/20 transition"
                title="Settings"
              >
                <Settings size={20} className="text-sage-dark" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-sage-light/20 transition"
                title="Sign out"
              >
                <LogOut size={20} className="text-sage-dark" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: '#1a1a1a' }}>
            Your Messages
          </h1>
          <p className="text-sage-dark mt-1">
            {activeMessageCount} message{activeMessageCount !== 1 ? 's' : ''} from your special day
          </p>
        </div>

        {/* Greeting Card */}
        {event && (
          <div className="mb-8">
            <GreetingCard
              eventId={event.id}
              greetingAudioUrl={event.greeting_audio_url}
              greetingText={event.greeting_text}
              onUpdate={loadMessages}
            />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm mb-6" style={{ border: '1px solid #e8ece9' }}>
          <div className="p-4">
            {/* Top row: filter tabs + actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: filter === 'all' ? '#3D5A4C' : 'transparent',
                    color: filter === 'all' ? 'white' : '#6E7D71'
                  }}
                >
                  <MessageCircle size={16} />
                  All ({activeMessageCount})
                </button>
                <button
                  onClick={() => setFilter('favorites')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: filter === 'favorites' ? '#3D5A4C' : 'transparent',
                    color: filter === 'favorites' ? 'white' : '#6E7D71'
                  }}
                >
                  <Heart size={16} />
                  Favourites ({favCount})
                </button>
                <button
                  onClick={() => setFilter('trash')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: filter === 'trash' ? '#3D5A4C' : 'transparent',
                    color: filter === 'trash' ? 'white' : '#6E7D71'
                  }}
                >
                  <Trash2 size={16} />
                  Bin ({trashCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                  {selectedTags.length > 0 && (
                    <span className="text-xs font-bold" style={{ color: '#3D5A4C' }}>
                      {selectedTags.length}
                    </span>
                  )}
                </button>

                {/* Sort dropdown */}
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
                    <div
                      className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20"
                      style={{ border: '1px solid #e8ece9', minWidth: '140px' }}
                    >
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: '#D4A5A5', color: 'white' }}
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Download All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="mt-3 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
              <input
                type="text"
                placeholder="Search by name, notes, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: '#e8ece9', color: '#1a1a1a' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={16} className="text-sage" />
                </button>
              )}
            </div>

            {/* Tags filter (expandable) */}
            {showFilters && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e8ece9' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-sage-dark uppercase tracking-wider">Filter by tag</p>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-sage-dark hover:text-deep-green transition"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag))
                        } else {
                          setSelectedTags([...selectedTags, tag])
                        }
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

        {/* Messages Grid */}
        {filteredMessages.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMessages.map((message) => {
              const name = getDisplayName(message)
              const duration = getDuration(message)
              const timestamp = getTimestamp(message)
              const fav = isFavorited(message)
              const progress = playbackProgress[message.id] || 0
              const isPlaying = currentlyPlaying === message.id

              return (
                <div
                  key={message.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md group"
                  style={{ border: '1px solid #e8ece9' }}
                >
                  {/* Photo area */}
                  {message.photo_url ? (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={message.photo_url}
                        alt={name || 'Guest photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)'
                      }}></div>
                    </div>
                  ) : null}

                  <div className="p-4">
                    {/* Top: Name + menu */}
                    <div className="flex items-start justify-between mb-3">
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
                              className="text-sm font-medium px-2 py-1 rounded border focus:outline-none focus:ring-2"
                              style={{ borderColor: '#e8ece9', color: '#1a1a1a' }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateGuestName(message.id)}
                              className="p-1 rounded hover:bg-sage-light/20"
                            >
                              <Check size={14} style={{ color: '#3D5A4C' }} />
                            </button>
                            <button
                              onClick={() => setEditingName(null)}
                              className="p-1 rounded hover:bg-sage-light/20"
                            >
                              <X size={14} className="text-sage-dark" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (filter !== 'trash') {
                                setEditingName(message.id)
                                setEditNameValue(name || '')
                              }
                            }}
                            className="text-left group/name"
                          >
                            <p className="font-medium text-sm truncate" style={{ color: '#1a1a1a' }}>
                              {name || (
                                <span className="text-sage italic flex items-center gap-1">
                                  <User size={14} />
                                  Tap to add name
                                </span>
                              )}
                            </p>
                          </button>
                        )}

                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-sage-dark flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(timestamp).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short'
                            })}
                          </p>
                          <span className="text-sage-light">&middot;</span>
                          <p className="text-xs text-sage-dark">
                            {formatDuration(duration)}
                          </p>
                          {message.caller_number && (
                            <>
                              <span className="text-sage-light">&middot;</span>
                              <p className="text-xs text-sage-dark flex items-center gap-1">
                                <Phone size={10} />
                                {message.caller_number.slice(-4)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action menu */}
                      {filter !== 'trash' && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                            className="p-1.5 rounded-lg hover:bg-sage-light/20 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <MoreHorizontal size={16} className="text-sage-dark" />
                          </button>
                          {activeMenu === message.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                              <div
                                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20"
                                style={{ border: '1px solid #e8ece9', minWidth: '160px' }}
                              >
                                <button
                                  onClick={() => {
                                    photoMessageRef.current = message.id
                                    photoInputRef.current?.click()
                                    setActiveMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                                  style={{ color: '#6E7D71' }}
                                >
                                  <ImageIcon size={14} />
                                  {message.photo_url ? 'Change photo' : 'Add photo'}
                                </button>
                                <button
                                  onClick={() => {
                                    setTagMenuOpen(tagMenuOpen === message.id ? null : message.id)
                                    setActiveMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                                  style={{ color: '#6E7D71' }}
                                >
                                  <Tag size={14} />
                                  Edit tags
                                </button>
                                <button
                                  onClick={() => {
                                    handleShare(message.recording_url, name)
                                    setActiveMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-sage-light/20 transition flex items-center gap-2"
                                  style={{ color: '#6E7D71' }}
                                >
                                  <Share2 size={14} />
                                  Share
                                </button>
                                <div style={{ borderTop: '1px solid #e8ece9', margin: '4px 0' }}></div>
                                <button
                                  onClick={() => handleSoftDelete(message.id)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-rose-light/20 transition flex items-center gap-2"
                                  style={{ color: '#C08585' }}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tag menu (inline) */}
                    {tagMenuOpen === message.id && (
                      <div className="mb-3 p-3 rounded-lg" style={{ background: '#f5f0e8' }}>
                        <div className="flex flex-wrap gap-1.5">
                          {AVAILABLE_TAGS.map(tag => (
                            <button
                              key={tag}
                              onClick={() => handleToggleTag(message.id, tag)}
                              className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                              style={{
                                background: (message.tags || []).includes(tag) ? '#3D5A4C' : 'white',
                                color: (message.tags || []).includes(tag) ? 'white' : '#6E7D71',
                                border: '1px solid',
                                borderColor: (message.tags || []).includes(tag) ? '#3D5A4C' : '#e8ece9'
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setTagMenuOpen(null)}
                          className="mt-2 text-xs font-medium transition"
                          style={{ color: '#3D5A4C' }}
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {/* Tags display */}
                    {message.tags && message.tags.length > 0 && tagMenuOpen !== message.id && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {message.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: '#f5f0e8', color: '#6E7D71' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Play button + progress bar */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlay(message.id, message.recording_url)}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: isPlaying ? '#D4A5A5' : '#3D5A4C',
                          color: 'white'
                        }}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                      </button>

                      <div className="flex-1">
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#e8ece9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: isPlaying ? '#D4A5A5' : '#3D5A4C'
                            }}
                          ></div>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-sage-dark flex-shrink-0">
                        {formatDuration(duration)}
                      </span>
                    </div>

                    {/* Notes */}
                    {message.notes && (
                      <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: '#f5f0e8', color: '#6E7D71' }}>
                        {message.notes}
                      </p>
                    )}

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                      {filter === 'trash' ? (
                        <button
                          onClick={() => handleRestore(message.id)}
                          className="flex items-center gap-1.5 text-xs font-medium transition"
                          style={{ color: '#3D5A4C' }}
                        >
                          <Undo2 size={14} />
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleFavorite(message.id, fav)}
                            className="flex items-center gap-1.5 text-xs font-medium transition"
                            style={{ color: fav ? '#C08585' : '#8B9B8E' }}
                          >
                            <Heart size={16} fill={fav ? '#C08585' : 'none'} />
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(message.recording_url, name)}
                              className="p-2 rounded-lg hover:bg-sage-light/20 transition"
                              title="Download"
                            >
                              <Download size={16} className="text-sage-dark" />
                            </button>
                            <button
                              onClick={() => handleShare(message.recording_url, name)}
                              className="p-2 rounded-lg hover:bg-sage-light/20 transition"
                              title="Share"
                            >
                              <Share2 size={16} className="text-sage-dark" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Photo uploading indicator */}
                    {photoUploading === message.id && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-sage-dark">
                        <div className="w-3 h-3 border-2 border-deep-green border-t-transparent rounded-full animate-spin"></div>
                        Uploading photo...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {showSortMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowSortMenu(false)}></div>
      )}
    </div>
  )
}
