'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TypingIndicatorProps {
  roomId: string
  currentUserId: string
}

export function TypingIndicator({ roomId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`typing:${roomId}`)

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.user_id === currentUserId) return

        setTypingUsers((prev) => {
          if (payload.is_typing && !prev.includes(payload.username)) {
            return [...prev, payload.username]
          } else if (!payload.is_typing) {
            return prev.filter((u) => u !== payload.username)
          }
          return prev
        })

        // Auto-remove after 3 seconds
        if (payload.is_typing) {
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== payload.username))
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, currentUserId, supabase])

  if (typingUsers.length === 0) return null

  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <div className="flex items-center gap-1 px-3 py-2 bg-secondary/50 rounded-3xl rounded-bl-sm w-fit">
        <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">
        {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
        {typingUsers.length === 2 && `${typingUsers[0]} and ${typingUsers[1]} are typing...`}
        {typingUsers.length > 2 && `${typingUsers.length} people are typing...`}
      </span>
    </div>
  )
}
