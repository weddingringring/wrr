'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import AudioPlayer from '@/components/dashboard/AudioPlayer'

interface Message {
  id: string
  caller_name: string | null
  caller_number: string
  duration: number
  recording_url: string
  recorded_at: string
  is_heard: boolean
  is_favorite: boolean
  notes: string | null
  tags: string[]
}

interface Event {
  id: string
  partner_1_name: string
  partner_2_name: string | null
  event_date: string
  event_type: string
}

export default function CoupleDashboard() {
  const [accessCode, setAccessCode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState<'all' | 'new' | 'favorites'>('all')
  
  // Check if access code is in localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('wrr_access_code')
    if (savedCode) {
      setAccessCode(savedCode)
      handleAccessCodeSubmit(savedCode)
    }
  }, [])
  
  const handleAccessCodeSubmit = async (code?: string) => {
    const codeToUse = code || accessCode
    setLoading(true)
    setError(null)
    
    try {
      // Look up event by access code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('access_code', codeToUse.toUpperCase())
        .single()
      
      if (eventError || !eventData) {
        throw new Error('Invalid access code. Please check and try again.')
      }
      
      setEvent(eventData)
      setIsAuthenticated(true)
      localStorage.setItem('wrr_access_code', codeToUse.toUpperCase())
      
      // Load messages for this event
      loadMessages(eventData.id)
      
      // Update first_accessed_at if not set
      if (!eventData.first_accessed_at) {
        await supabase
          .from('events')
          .update({ first_accessed_at: new Date().toISOString() })
          .eq('id', eventData.id)
      }
      
    } catch (err: any) {
      setError(err.message)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }
  
  const loadMessages = async (eventId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', eventId)
      .order('recorded_at', { ascending: false })
    
    if (error) {
      console.error('Error loading messages:', error)
      return
    }
    
    setMessages(data || [])
  }
  
  const handleLogout = () => {
    localStorage.removeItem('wrr_access_code')
    setIsAuthenticated(false)
    setAccessCode('')
    setEvent(null)
    setMessages([])
  }
  
  const markAsHeard = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_heard: true })
      .eq('id', messageId)
    
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, is_heard: true } : msg
    ))
  }
  
  const toggleFavorite = async (messageId: string, currentState: boolean) => {
    await supabase
      .from('messages')
      .update({ is_favorite: !currentState })
      .eq('id', messageId)
    
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, is_favorite: !currentState } : msg
    ))
  }
  
  const updateCallerName = async (messageId: string, name: string) => {
    await supabase
      .from('messages')
      .update({ caller_name: name })
      .eq('id', messageId)
    
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, caller_name: name } : msg
    ))
  }
  
  const downloadMessage = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }
  
  const downloadAll = async () => {
    // In production, you'd create a ZIP file server-side
    // For now, download each file individually
    messages.forEach((msg, index) => {
      setTimeout(() => {
        downloadMessage(
          msg.recording_url,
          `message-${index + 1}-${msg.caller_name || 'guest'}.mp3`
        )
      }, index * 500)
    })
  }
  
  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (filter === 'new') return !msg.is_heard
    if (filter === 'favorites') return msg.is_favorite
    return true
  })
  
  // Stats
  const totalDuration = messages.reduce((acc, msg) => acc + msg.duration, 0)
  const newCount = messages.filter(msg => !msg.is_heard).length
  const favoriteCount = messages.filter(msg => msg.is_favorite).length
  
  // Access Code Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl text-charcoal mb-2">
              Welcome Back
            </h1>
            <p className="text-sage-dark">
              Enter your access code to listen to your messages
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-light border border-rose rounded-lg">
              <p className="text-rose-dark text-center">{error}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleAccessCodeSubmit(); }}>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="ABC12345"
                className="w-full px-4 py-3 border border-sage-light rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-deep-green uppercase"
                required
              />
              <p className="text-sm text-sage-dark text-center mt-2">
                8-character code from your venue
              </p>
              
              <button
                type="submit"
                disabled={loading || accessCode.length !== 8}
                className="w-full mt-6 py-3 bg-deep-green text-white rounded-lg font-medium hover:bg-deep-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
  
  // Main Dashboard
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-light shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl text-charcoal">
                {event?.partner_1_name}
                {event?.partner_2_name && ` & ${event.partner_2_name}`}
              </h1>
              <p className="text-sm text-sage-dark mt-1">
                {new Date(event?.event_date || '').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-sm text-sage-dark hover:text-charcoal transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Total Messages</p>
            <p className="text-3xl font-bold text-deep-green">{messages.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">New Messages</p>
            <p className="text-3xl font-bold text-rose">{newCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Favorites</p>
            <p className="text-3xl font-bold text-gold">{favoriteCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-sage-dark mb-1">Total Duration</p>
            <p className="text-3xl font-bold text-charcoal">
              {Math.floor(totalDuration / 60)}m
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-deep-green text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              All ({messages.length})
            </button>
            
            <button
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'new'
                  ? 'bg-rose text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              New ({newCount})
            </button>
            
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'favorites'
                  ? 'bg-gold text-white'
                  : 'bg-white text-charcoal hover:bg-sage-light/30'
              }`}
            >
              Favorites ({favoriteCount})
            </button>
          </div>
          
          <button
            onClick={downloadAll}
            className="ml-auto px-6 py-2 bg-white text-charcoal rounded-lg hover:bg-sage-light/30 transition border border-sage-light"
          >
            Download All
          </button>
        </div>
        
        {/* Messages */}
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-xl text-sage-dark">
              {filter === 'new' && 'No new messages'}
              {filter === 'favorites' && 'No favorites yet'}
              {filter === 'all' && 'No messages yet'}
            </p>
            <p className="text-sm text-sage-dark mt-2">
              Messages will appear here as guests call in
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-xl shadow-sm p-6 relative"
              >
                {/* New badge */}
                {!message.is_heard && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-rose-light text-rose-dark text-sm rounded-full">
                    New
                  </span>
                )}
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={message.caller_name || ''}
                        onChange={(e) => updateCallerName(message.id, e.target.value)}
                        placeholder="Add name (e.g., Uncle Bob)"
                        className="font-serif text-xl text-charcoal bg-transparent border-b border-transparent hover:border-sage-light focus:border-deep-green outline-none transition"
                      />
                      
                      <button
                        onClick={() => toggleFavorite(message.id, message.is_favorite)}
                        className="text-2xl transition"
                      >
                        {message.is_favorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    
                    <p className="text-sm text-sage-dark mt-1">
                      {new Date(message.recorded_at).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => downloadMessage(message.recording_url, `message-${message.caller_name || 'guest'}.mp3`)}
                    className="text-deep-green hover:text-deep-green-dark transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
                
                {/* Audio Player */}
                <AudioPlayer
                  url={message.recording_url}
                  duration={message.duration}
                  onPlay={() => markAsHeard(message.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
