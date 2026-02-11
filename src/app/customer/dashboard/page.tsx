'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import GreetingCard from './GreetingCard'

interface Message {
  id: string
  caller_number: string
  recording_url: string
  duration_seconds: number
  created_at: string
  is_favorite: boolean
  guest_name: string | null
  notes: string | null
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audio] = useState(typeof Audio !== 'undefined' ? new Audio() : null)
  const [event, setEvent] = useState<any>(null)
  
  const availableTags = ['Family', 'Friends', 'Funny', 'Emotional', 'Heartfelt', 'Work', 'Surprise']
  
  useEffect(() => {
    checkAuth()
    loadMessages()
    
    return () => {
      audio?.pause()
    }
  }, [])
  
  useEffect(() => {
    filterAndSortMessages()
  }, [filter, searchQuery, sortBy, selectedTags, messages])
  
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/customer/login')
      return
    }
    
    // Get customer's event
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
      
      // Get customer's event (including greeting fields)
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('customer_user_id', user.id)
        .single()
      
      if (!eventData) return
      
      // Update event state with fresh data (including greeting_audio_url)
      setEvent(eventData)
      
      // Get messages for this event
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
    
    // Filter by favorites
    if (filter === 'favorites') {
      filtered = filtered.filter(m => m.is_favorite)
    }
    
    // Filter by search query (guest name or notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        (m.guest_name?.toLowerCase().includes(query)) ||
        (m.notes?.toLowerCase().includes(query))
      )
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(m => 
        m.tags && selectedTags.some(tag => m.tags.includes(tag))
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'longest':
          return b.duration_seconds - a.duration_seconds
        case 'shortest':
          return a.duration_seconds - b.duration_seconds
        default:
          return 0
      }
    })
    
    setFilteredMessages(filtered)
  }
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }
  
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSortBy('newest')
    setFilter('all')
  }
  
  const handlePlay = async (messageId: string, recordingUrl: string) => {
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
      
      // Update local state
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_favorite: !currentStatus } : m
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }
  
  const handleDownload = async (recordingUrl: string, messageId: string) => {
    try {
      const response = await fetch(recordingUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `message-${messageId}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading message:', error)
    }
  }
  
  const handleDownloadAll = async () => {
    // In production, this would create a ZIP file
    alert('Download all feature would create a ZIP file with all messages')
  }
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/customer/login')
  }
  
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
  
  const getEventDisplayName = () => {
    if (!event) return ''
    
    if (event.event_type === 'wedding') {
      return event.partner_2_name 
        ? `${event.partner_1_name} & ${event.partner_2_name}'s Wedding`
        : `${event.partner_1_name}'s Wedding`
    }
    return `${event.partner_1_name}'s ${event.event_type}`
  }
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <img src="/logo.svg" alt="WeddingRingRing" className="h-10" />
              <p className="text-xs text-sage-dark mt-1">{getEventDisplayName()}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/customer/settings"
                className="text-sm text-sage-dark hover:text-charcoal transition"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-sage-dark hover:text-charcoal transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-charcoal mb-2">Your Messages</h1>
          <p className="text-sage-dark">
            {messages.length} message{messages.length !== 1 ? 's' : ''} from your special day
          </p>
        </div>

        {/* Greeting Card */}
        {event && (
          <GreetingCard
            eventId={event.id}
            greetingAudioUrl={event.greeting_audio_url}
            greetingText={event.greeting_text}
            onUpdate={loadMessages}
          />
        )}
        
        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-deep-green text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              All Messages ({messages.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'favorites'
                  ? 'bg-deep-green text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              ❤️ Favorites ({messages.filter(m => m.is_favorite).length})
            </button>
          </div>
          
          {messages.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="px-6 py-2 bg-rose text-white rounded-lg font-medium hover:bg-rose-dark transition"
            >
              ⬇️ Download All
            </button>
          )}
        </div>
        
        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-xl text-sage-dark mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No messages yet'}
            </p>
            <p className="text-sm text-sage-dark">
              {filter === 'favorites' 
                ? 'Mark messages as favorites by clicking the heart icon'
                : 'Messages will appear here as guests call in'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => handlePlay(message.id, message.recording_url)}
                        className="w-12 h-12 rounded-full bg-deep-green text-white flex items-center justify-center hover:bg-deep-green-dark transition"
                      >
                        {currentlyPlaying === message.id ? '⏸' : '▶'}
                      </button>
                      
                      <div>
                        <p className="font-medium text-charcoal">
                          {message.guest_name || 'Unknown Guest'}
                        </p>
                        <p className="text-sm text-sage-dark">
                          {new Date(message.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {formatDuration(message.duration_seconds)}
                        </p>
                      </div>
                    </div>
                    
                    {message.notes && (
                      <p className="text-sm text-charcoal ml-15 mt-2 p-3 bg-sage-light/20 rounded-lg">
                        {message.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFavorite(message.id, message.is_favorite)}
                      className={`p-2 rounded-lg transition ${
                        message.is_favorite
                          ? 'bg-rose-light text-rose'
                          : 'bg-sage-light/30 text-sage-dark hover:bg-sage-light'
                      }`}
                      title={message.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      ❤️
                    </button>
                    
                    <button
                      onClick={() => handleDownload(message.recording_url, message.id)}
                      className="p-2 bg-sage-light/30 text-sage-dark rounded-lg hover:bg-sage-light transition"
                      title="Download message"
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
