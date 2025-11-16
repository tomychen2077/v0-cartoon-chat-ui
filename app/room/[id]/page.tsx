'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChatBubble } from '@/components/chat-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { Heart, SendHorizontal, Smile, Paperclip, Users, Info, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
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
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [roomId, setRoomId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/get-messages?room_id=${roomId}`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        
        const data = await response.json()
        setMessages(data || [])
        setLoading(false)
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
            setMessages((prev) => [...prev, newMessage])
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          content: inputValue.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      setInputValue('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

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
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex h-9 w-9 sm:h-10 sm:w-10">
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex h-9 w-9 sm:h-10 sm:w-10">
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
              <MoreVertical className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Container - Mobile responsive */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-4 md:p-6 space-y-1 sm:space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-foreground/60 text-sm sm:text-base">No messages yet. Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg) => (
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
              />
            ))
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

            {/* Input Field - Mobile responsive */}
            <div className="flex gap-1 sm:gap-2 items-end">
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
              >
                <Paperclip className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="rounded-full px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base flex-1 min-w-0 h-8 sm:h-10"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-primary hover:bg-primary/90 rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                size="icon"
                disabled={sending || !inputValue.trim()}
              >
                <SendHorizontal className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 flex flex-col gap-2 md:hidden">
        <Button
          size="icon"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>
    </div>
  )
}
