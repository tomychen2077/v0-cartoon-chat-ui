'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChatBubble } from '@/components/chat-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { Heart, SendHorizontal, Smile, Paperclip, Users, Info, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export default function ChatRoom({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', message: 'Hey everyone! Welcome to the General Chat!', timestamp: '10:30 AM', reactions: [{ emoji: '👋', count: 5 }] },
    { id: 2, sender: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', message: 'Thanks for having us! This is looking great', timestamp: '10:31 AM', reactions: [{ emoji: '😊', count: 3 }] },
    { id: 3, sender: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You', message: 'Love the new interface!', timestamp: '10:32 AM', isOwn: true, reactions: [{ emoji: '❤️', count: 8 }] },
    { id: 4, sender: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', message: 'Is anyone up for gaming later?', timestamp: '10:33 AM', reactions: [{ emoji: '🎮', count: 4 }, { emoji: '👍', count: 2 }] },
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'You',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
        message: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        reactions: [],
      }])
      setInputValue('')
      
      // Simulate someone typing
      setTimeout(() => {
        setIsTyping(true)
        setTypingUser('Sam')
        setTimeout(() => {
          setIsTyping(false)
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            sender: 'Sam',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
            message: '😂 Sounds good to me!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: [],
          }])
        }, 2000)
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const emojis = ['😊', '😂', '🎉', '❤️', '🔥', '👍', '🎮', '🎵', '✨', '💯']

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
                💬
              </div>
              <div>
                <h2 className="font-bold text-lg">General Chat</h2>
                <p className="text-xs text-foreground/60">2,543 members online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
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
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.message}
              sender={msg.sender}
              avatar={msg.avatar}
              isOwn={msg.isOwn}
              timestamp={msg.timestamp}
              reactions={msg.reactions}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 mb-4">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sam"
                alt={typingUser}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex items-center gap-1 px-4 py-2 bg-secondary/50 rounded-3xl rounded-bl-sm">
                <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
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
            />
            <Button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary/90 rounded-full"
              size="icon"
            >
              <SendHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

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
