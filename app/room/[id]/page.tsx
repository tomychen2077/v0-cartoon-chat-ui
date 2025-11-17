'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChatBubble } from '@/components/chat-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { SendHorizontal, Smile, Paperclip, MoreVertical, Edit, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  media_url?: string
  media_type?: string
  profiles?: {
    username: string
    avatar_url?: string
  }
}

interface Room {
  id: string
  name: string
  emoji: string
  topic: string
  description?: string
  member_count?: number
  created_by?: string
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [visibleCount, setVisibleCount] = useState<number>(200)
  const [room, setRoom] = useState<Room | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [roomId, setRoomId] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const sendQueueRef = useRef<any[]>([])
  const flushTimerRef = useRef<number | null>(null)
  const lastInputEventTimeRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Handle async params for Next.js 16
  useEffect(() => {
    const getRoomId = async () => {
      const resolvedParams = await Promise.resolve(params)
      setRoomId(resolvedParams.id)
    }
    getRoomId()
  }, [params])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  // Fetch room information
  useEffect(() => {
    if (!roomId) return

    const fetchRoom = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single()

        if (error) throw error
        setRoom(data)
      } catch (err) {
        console.error('Error fetching room:', err)
        router.push('/')
      }
    }

    fetchRoom()
  }, [roomId, supabase, router])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  // Join/leave membership tracking
  useEffect(() => {
    let joined = false
    const join = async () => {
      if (!roomId || !currentUser?.id) return
      try {
        const { error } = await supabase
          .from('room_members')
          .insert({ room_id: roomId, user_id: currentUser.id })
        if (!error) joined = true
      } catch (err: any) {
        // Ignore unique violations
      }
    }
    join()
    return () => {
      if (!roomId || !currentUser?.id) return
      if (!joined) return
      supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .then(() => {})
        .catch(() => {})
    }
  }, [roomId, currentUser, supabase])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/get-messages?room_id=${roomId}`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        
        const data = await response.json()
        performance.mark('messages_fetch_start')
        setMessages(data || [])
        setLoading(false)
        requestAnimationFrame(() => {
          performance.mark('messages_render_end')
          performance.measure('messages_initial_render', 'messages_fetch_start', 'messages_render_end')
        })
        setTimeout(scrollToBottom, 100)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setLoading(false)
      }
    }

    if (roomId) {
      fetchMessages()
    }
  }, [roomId])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the new message with profile data
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              profiles (username, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            performance.mark('message_append_start')
            setMessages((prev) => [...prev, newMessage])
            requestAnimationFrame(() => {
              performance.mark('message_append_end')
              performance.measure('message_append_render', 'message_append_start', 'message_append_end')
            })
            setTimeout(scrollToBottom, 100)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const el = messagesContainerRef.current
    if (!el) return
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
        })
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll as any)
    }
  }, [])

  const tryGzip = async (data: any) => {
    try {
      // @ts-ignore
      if (typeof CompressionStream !== 'undefined') {
        // @ts-ignore
        const cs = new CompressionStream('gzip')
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        const stream = blob.stream().pipeThrough(cs)
        const compressed = await new Response(stream).arrayBuffer()
        return new Uint8Array(compressed)
      }
    } catch {}
    return null
  }

  const flushQueue = async () => {
    if (!sendQueueRef.current.length) return
    const batch = sendQueueRef.current.splice(0, sendQueueRef.current.length)
    const gz = await tryGzip({ room_id: roomId, messages: batch })
    const response = await fetch('/api/chat/send-batch', {
      method: 'POST',
      headers: gz ? { 'Content-Encoding': 'gzip' } : { 'Content-Type': 'application/json' },
      body: gz ? (gz as any) : JSON.stringify({ room_id: roomId, messages: batch }),
    })
    if (!response.ok) {
      try {
        const err = await response.json()
        console.error('Batch send error:', err)
      } catch {}
    }
  }

  const scheduleFlush = () => {
    if (flushTimerRef.current) return
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      flushQueue()
    }, 200) as unknown as number
  }

  const enqueueMessage = (payload: { content: string; media_url?: string | null; media_type?: string | null }) => {
    sendQueueRef.current.push(payload)
    scheduleFlush()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please select an image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedFile) || !currentUser || sending) return

    setSending(true)
    setUploadingMedia(true)
    let mediaUrl: string | null = null
    let mediaType: string | null = null

    try {
      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('room_id', roomId)

        const uploadResponse = await fetch('/api/chat/upload-media', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media')
        }

        const uploadData = await uploadResponse.json()
        mediaUrl = uploadData.media_url
        mediaType = uploadData.media_type
      }

      const content = inputValue.trim() || (selectedFile ? '📷 Photo' : '')
      if (lastInputEventTimeRef.current) {
        const latency = performance.now() - lastInputEventTimeRef.current
        try { console.log('input_latency_ms', Math.round(latency)) } catch {}
      }
      enqueueMessage({
        content,
        media_url: mediaUrl,
        media_type: mediaType,
      })

      setInputValue('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
      setUploadingMedia(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/delete?id=${roomId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete room')
      }

      router.push('/')
    } catch (err) {
      console.error('Error deleting room:', err)
      alert('Failed to delete room. Please try again.')
    }
  }

  const isRoomOwner = currentUser && room && room.created_by === currentUser.id

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/delete-message?id=${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Failed to delete message. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      lastInputEventTimeRef.current = performance.now()
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    const id = setInterval(() => {
      const mem: any = (performance as any).memory
      if (mem) {
        try {
          console.log('memory_mb', Math.round(mem.usedJSHeapSize / 1048576))
        } catch {}
      }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const getAvatar = (message: Message) => {
    if (message.profiles?.avatar_url) {
      return message.profiles.avatar_url
    }
    const username = message.profiles?.username || message.user_id || 'user'
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  }

  const getSenderName = (message: Message) => {
    return message.profiles?.username || 'Anonymous'
  }

  const emojis = ['😊', '😂', '🎉', '❤️', '🔥', '👍', '🎮', '🎵', '✨', '💯']

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/60">Loading chat room...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground/60 mb-4">Room not found</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Mobile responsive */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
            <Link href="/" className="hover:opacity-70 transition-opacity flex-shrink-0">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChatBloom
              </h1>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                {room.emoji || '💬'}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base sm:text-lg truncate">{room.name}</h2>
                <p className="text-xs text-foreground/60 truncate">{room.topic}</p>
              </div>
            </div>
            {/* Mobile room info */}
            <div className="sm:hidden flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                {room.emoji || '💬'}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-xs truncate">{room.name}</h2>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setShowRoomMenu(!showRoomMenu)}
              >
                <MoreVertical className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
              {showRoomMenu && isRoomOwner && (
                <>
                  <div 
                    className="fixed inset-0 z-[5] bg-background/20"
                    onClick={() => setShowRoomMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-card border border-border rounded-lg shadow-lg p-1 z-10 min-w-[140px]">
                    <Link href={`/room/${roomId}/edit`}>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit Room
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        setShowRoomMenu(false)
                        handleDeleteRoom()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 active:bg-destructive/20 text-destructive rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Room
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container - Mobile responsive */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-1.5 sm:p-4 md:p-6 space-y-1 sm:space-y-4">
        <div
          className="max-w-4xl mx-auto"
          onClick={(e) => {
            const target = e.target as HTMLElement
            const actionEl = target.closest('[data-action]') as HTMLElement | null
            if (actionEl) {
              const action = actionEl.getAttribute('data-action')
              const id = actionEl.getAttribute('data-message-id')
              if (action === 'delete' && id) {
                handleDeleteMessage(id)
              }
            }
          }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-foreground/60 text-sm sm:text-base">No messages yet. Be the first to say something!</p>
            </div>
          ) : (
            (() => {
              const start = Math.max(0, messages.length - visibleCount)
              const visible = messages.slice(start)
              return (
                <>
                  {start > 0 && (
                    <div className="flex justify-center py-2">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setVisibleCount((c) => c + 200)}>
                        Load older messages
                      </Button>
                    </div>
                  )}
                  {visible.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg.content}
                      sender={getSenderName(msg)}
                      avatar={getAvatar(msg)}
                      isOwn={currentUser?.id === msg.user_id}
                      timestamp={formatTimestamp(msg.created_at)}
                      reactions={[]}
                      messageId={msg.id}
                      onDelete={handleDeleteMessage}
                      mediaUrl={msg.media_url}
                      mediaType={msg.media_type}
                    />
                  ))}
                </>
              )
            })()
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section - Mobile responsive */}
      {!currentUser ? (
        <div className="border-t border-border bg-background p-2 sm:p-4 text-center">
          <p className="text-foreground/60 mb-1.5 sm:mb-2 text-xs sm:text-base">Please sign in to send messages</p>
          <Link href="/auth">
            <Button size="sm" className="text-xs sm:text-sm h-7 sm:h-9">Sign In</Button>
          </Link>
        </div>
      ) : (
        <div className="border-t border-border bg-background sticky bottom-0 p-2 sm:p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Card className="mb-2 sm:mb-4 p-2 sm:p-4 bg-card">
                <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputValue(inputValue + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-xl sm:text-2xl hover:scale-125 transition-transform p-1 sm:p-2"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="mb-2 relative inline-block">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Field - Mobile responsive */}
            <div className="flex gap-1 sm:gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
              >
                <Paperclip className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="rounded-full px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base flex-1 min-w-0 h-8 sm:h-10"
                disabled={sending || uploadingMedia}
              />
              <Button
                onClick={() => {
                  lastInputEventTimeRef.current = performance.now()
                  handleSendMessage()
                }}
                className="bg-primary hover:bg-primary/90 rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                size="icon"
                disabled={sending || uploadingMedia || (!inputValue.trim() && !selectedFile)}
              >
                {uploadingMedia ? (
                  <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendHorizontal className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
