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
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChatBloom
              </h1>
            </Link>
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-xl">
                {room.emoji || '💬'}
              </div>
              <div>
                <h2 className="font-bold text-lg">{room.name}</h2>
                <p className="text-xs text-foreground/60">{room.topic}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full">
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60">No messages yet. Be the first to say something!</p>
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
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      {!currentUser ? (
        <div className="border-t border-border bg-background p-4 text-center">
          <p className="text-foreground/60 mb-2">Please sign in to send messages</p>
          <Link href="/auth">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      ) : (
        <div className="border-t border-border bg-background sticky bottom-0 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Card className="mb-4 p-4 bg-card">
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputValue(inputValue + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-2xl hover:scale-125 transition-transform p-2"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Input Field */}
            <div className="flex gap-2 items-end">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="rounded-full px-6 py-2 flex-1"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-primary hover:bg-primary/90 rounded-full"
                size="icon"
                disabled={sending || !inputValue.trim()}
              >
                <SendHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 flex flex-col gap-2 md:hidden">
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
