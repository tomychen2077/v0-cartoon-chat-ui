'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChatBubble } from '@/components/chat-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { SendHorizontal, Smile, Paperclip, MoreVertical, Edit, Trash2, X, Copy, MessageCircle } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationsPopover } from '@/components/notifications-popover'

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
  const [joined, setJoined] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [startingGuest, setStartingGuest] = useState(false)
  const [inviteCreating, setInviteCreating] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const sendQueueRef = useRef<any[]>([])
  const flushTimerRef = useRef<number | null>(null)
  const lastInputEventTimeRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const receivedIdsRef = useRef<Set<string>>(new Set())
  const lastImmediateSendRef = useRef<number | null>(null)
  const [latencies, setLatencies] = useState<number[]>([])
  const supabase = createClient()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const [joinError, setJoinError] = useState<string | null>(null)
  const router = useRouter()

  const handleLeaveRoom = async () => {
    try {
      if (!currentUser?.id || !roomId) { router.push('/'); return }
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
      router.push('/')
    } catch (e) {
      router.push('/')
    }
  }

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

  const handleCreateInvite = async () => {
    setInviteCreating(true)
    setInviteError(null)
    setInviteToken(null)
    try {
      const res = await fetch('/api/rooms/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invite')
      setInviteToken(data.token)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create invite'
      setInviteError(msg)
    } finally {
      setInviteCreating(false)
    }
  }

  const loadFriends = async () => {
    try {
      const res = await fetch('/api/friends/get?status=accepted')
      const data = await res.json()
      if (res.ok) {
        const list = ((data?.friends || data) as any[]) || []
        const ids = list
          .map((f: any) => f.friend_id || f.user_id || f.id)
          .filter((x: any) => !!x)
        if (ids.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', ids)
          const map = new Map((profs || []).map((p: any) => [p.id, p]))
          const enriched = list.map((f: any) => {
            const fid = f.friend_id || f.user_id || f.id
            const p = fid ? map.get(fid) : null
            return {
              ...f,
              id: fid,
              display_name: f.display_name || p?.display_name || f.username || p?.username,
              username: f.username || p?.username,
              avatar_url: f.avatar_url || p?.avatar_url,
            }
          })
          setFriends(enriched)
        } else {
          setFriends(list)
        }
      }
    } catch {}
  }

  const [addingFriends, setAddingFriends] = useState(false)
  const handleAddSelectedFriends = async () => {
    try {
      setAddingFriends(true)
      if (!roomId || selectedFriendIds.length === 0) { setShowAddFriends(false); return }
      const rows = selectedFriendIds.map((id) => ({ room_id: roomId, user_id: id }))
      await supabase.from('room_members').insert(rows)
      try {
        await fetch('/api/notifications/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipients: selectedFriendIds, type: 'room_member_added', room_id: roomId }),
        })
      } catch {}
      setShowAddFriends(false)
      setSelectedFriendIds([])
    } catch {
      setShowAddFriends(false)
    } finally {
      setAddingFriends(false)
    }
  }

  const pushSystemMessage = (text: string) => {
    const msg: Message = {
      id: `sys_${Date.now()}`,
      content: text,
      created_at: new Date().toISOString(),
      user_id: 'system',
      profiles: { username: 'System' },
    }
    setMessages((prev) => [...prev, msg])
    setTimeout(scrollToBottom, 100)
  }

  // Join first if possible (needed for private rooms with invites)
  useEffect(() => {
    if (!roomId) return

    const attemptJoin = async () => {
      if (!currentUser?.id) return
      try {
        const token = searchParams?.get('token') || null
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId, token }),
        })
        if (res.ok) {
          setJoined(true)
          setJoinError(null)
        } else {
          const msg = res.status === 403 ? 'Invite required or invalid' : res.status === 409 ? 'Room is full' : 'Failed to join'
          setJoinError(msg)
        }
      } catch {}
    }

    attemptJoin()
  }, [roomId, currentUser])

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
        setLoading(false)
        setJoinError('Room not found or you do not have access')
      }
    }

    fetchRoom()
  }, [roomId, supabase])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  // Join membership on mount; attempt robust cleanup on unmount and page leave
  useEffect(() => {
    const join = async () => {
      if (!roomId || !currentUser?.id) return
      try {
        // Already attempted a join above; no-op here
        setJoinError(null)
      } catch {}
    }
    join()

    const cleanup = async () => {
      if (!roomId || !currentUser?.id) return
      try {
        await supabase
          .from('room_members')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', currentUser.id)
      } catch {}
    }

    let hb: number | null = null
    const startHeartbeat = () => {
      if (!roomId) return
      const send = () => {
        try {
          fetch('/api/room-members/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId }),
            keepalive: true,
          }).catch(() => {})
        } catch {}
      }
      send()
      hb = window.setInterval(send, 25_000)
    }
    startHeartbeat()

    const sendBeaconLeave = () => {
      if (!roomId) return
      try {
        const body = new Blob([JSON.stringify({ room_id: roomId })], { type: 'application/json' })
        navigator.sendBeacon('/api/room-members/leave', body)
      } catch {}
    }

    const onBeforeUnload = () => {
      sendBeaconLeave()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendBeaconLeave()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (hb) { try { window.clearInterval(hb) } catch {} }
      try { cleanup() } catch {}
    }
  }, [roomId, currentUser, supabase, room])

  // Fetch initial messages
  useEffect(() => {
    const ac = new AbortController()
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/get-messages?room_id=${roomId}`, { signal: ac.signal })
        if (!response.ok) throw new Error('Failed to fetch messages')
        let data: any = []
        try {
          data = await response.json()
        } catch {
          data = []
        }
        performance.mark('messages_fetch_start')
        setMessages(data || [])
        setLoading(false)
        requestAnimationFrame(() => {
          performance.mark('messages_render_end')
          performance.measure('messages_initial_render', 'messages_fetch_start', 'messages_render_end')
        })
        setTimeout(scrollToBottom, 100)
      } catch (err) {
        const name = (err as any)?.name
        if (name !== 'AbortError') {
          console.error('Error fetching messages:', err)
        }
        setLoading(false)
      }
    }

    if (roomId) {
      fetchMessages()
    }
    return () => { try { ac.abort() } catch {} }
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
          if (receivedIdsRef.current.has(payload.new.id)) { return }
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
            receivedIdsRef.current.add(newMessage.id)
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
    if (batch.length === 1) {
      const m = batch[0]
      const clientTs = m.client_ts || performance.now()
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, content: m.content, media_url: m.media_url || null, media_type: m.media_type || null, client_ts: clientTs }),
      })
      if (response.ok) {
        const t = Math.round(performance.now() - clientTs)
        try { console.log('send_latency_ms', t) } catch {}
        setLatencies((prev) => { const arr = prev.slice(-49); arr.push(t); return arr })
        return
      }
      try {
        const err = await response.json()
        console.error('Send error:', err)
        if ((response.status === 401 || response.status === 403)) {
          pushSystemMessage('Create an account to send messages')
        } else {
          pushSystemMessage('Message failed to send. Please try again')
        }
      } catch {
        pushSystemMessage('Message failed to send. Please try again')
      }
      return
    }
    const gz = await tryGzip({ room_id: roomId, messages: batch })
    const response = await fetch('/api/chat/send-batch', {
      method: 'POST',
      headers: gz ? { 'Content-Encoding': 'gzip' } : { 'Content-Type': 'application/json' },
      body: gz ? (gz as any) : JSON.stringify({ room_id: roomId, messages: batch }),
    })
    if (response.ok) {
      let data: any = null
      try { data = await response.json() } catch { data = null }
      const items: any[] = data?.data || []
      items.forEach((row) => {
        const tmpId = row?.tmp_id
        if (row?.id && tmpId) {
          receivedIdsRef.current.add(row.id)
          const t = Math.round(performance.now() - (row.client_ts || performance.now()))
          try { console.log('send_latency_ms', t) } catch {}
          setLatencies((prev) => { const arr = prev.slice(-49); arr.push(t); return arr })
          const finalMsg: Message = { ...row, profiles: { username: 'You' } }
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]))
            map.delete(tmpId)
            map.set(finalMsg.id, finalMsg)
            return Array.from(map.values())
          })
        }
      })
      return
    }
    try {
      const err = await response.json()
      console.error('Batch send error:', err)
      if ((response.status === 401 || response.status === 403)) {
        pushSystemMessage('Create an account to send messages')
      } else {
        pushSystemMessage('Message failed to send. Please try again')
      }
    } catch {
      pushSystemMessage('Message failed to send. Please try again')
    }
  }

  const scheduleFlush = () => {
    if (flushTimerRef.current) return
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      flushQueue()
    }, 180) as unknown as number
  }

  const enqueueMessage = (payload: { content: string; media_url?: string | null; media_type?: string | null; client_ts?: number; tmp_id?: string }) => {
    sendQueueRef.current.push(payload)
    scheduleFlush()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isGuestUser) { pushSystemMessage('Create an account to upload images'); return }

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
    const tempId = `tmp_${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      content: inputValue.trim() || (selectedFile ? '📷 Photo' : ''),
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      profiles: { username: 'You' },
      media_url: selectedFile ? 'uploading' : undefined,
      media_type: undefined,
    }
    setMessages((prev) => [...prev, optimistic])
    setTimeout(scrollToBottom, 50)

    try {
      // Upload file if selected
      if (selectedFile) {
        if (isGuestUser) {
          throw new Error('Media uploads are not available in Guest mode')
        }
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
      const now = performance.now()
      const withinBurst = (lastImmediateSendRef.current && (now - lastImmediateSendRef.current) < 150) || sendQueueRef.current.length > 0
      if (withinBurst) {
        enqueueMessage({ content, media_url: mediaUrl, media_type: mediaType, client_ts: now, tmp_id: tempId })
      } else {
        lastImmediateSendRef.current = now
        const response = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId, content, media_url: mediaUrl || null, media_type: mediaType || null, client_ts: now }),
        })
        if (!response.ok) {
          try {
            const err = await response.json()
            console.error('Send error:', err)
            if ((response.status === 401 || response.status === 403)) {
              pushSystemMessage('Create an account to send messages')
            } else {
              pushSystemMessage('Message failed to send. Please try again')
            }
          } catch {
            pushSystemMessage('Message failed to send. Please try again')
          }
          setMessages((prev) => prev.filter((m) => m.id !== tempId))
        } else {
          let data: any = null
          try { data = await response.json() } catch { data = null }
          if (data?.id) {
            receivedIdsRef.current.add(data.id)
            const finalMsg: Message = { ...data, profiles: { username: 'You' } }
            setMessages((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]))
              map.delete(tempId)
              map.set(finalMsg.id, finalMsg)
              return Array.from(map.values())
            })
            const t = Math.round(performance.now() - (data.client_ts || now))
            try { console.log('send_latency_ms', t) } catch {}
            setLatencies((prev) => { const arr = prev.slice(-49); arr.push(t); return arr })
          }
        }
      }

      setInputValue('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      } catch (err) {
        console.error('Error sending message:', err)
        alert((err as any)?.message || 'Failed to send message. Please try again.')
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
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
  const isGuestUser = !!currentUser && (((currentUser as any).is_anonymous) || ((currentUser as any).app_metadata?.provider === 'anonymous'))

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
    if (username.startsWith('Guest')) return ''
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
            <NotificationsPopover />
            {process.env.NODE_ENV === 'development' && latencies.length > 0 && (
              <div className="ml-1 sm:ml-2 px-2 py-1 rounded-full text-xs bg-primary/10 text-foreground/70">
                {`avg ${Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length)}ms`}
                {` • max ${Math.max(...latencies)}ms`}
                {` • out ${latencies.filter((l)=>l > (latencies.reduce((a,b)=>a+b,0)/latencies.length)*1.7).length}`}
              </div>
            )}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setShowRoomMenu(!showRoomMenu)}
              >
                <MoreVertical className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Button>
              {currentUser && (
                <Button variant="outline" size="sm" className="rounded-full ml-1" onClick={handleLeaveRoom}>
                  Leave
                </Button>
              )}
              {showRoomMenu && isRoomOwner && (
                <>
                  <div 
                    className="fixed inset-0 z-[5] bg-background/20"
                    onClick={() => setShowRoomMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-card border border-border rounded-lg shadow-lg p-1 z-10 min-w-[200px]">
                    <Link href={`/room/${roomId}/edit`}>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit Room
                      </button>
                    </Link>
                    <button
                      onClick={() => { setShowAddFriends((v) => !v); if (!showAddFriends) loadFriends() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 active:bg-primary/20 rounded-md transition-colors"
                    >
                      Add Friends
                    </button>
                    <button
                      onClick={handleCreateInvite}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 active:bg-primary/20 rounded-md transition-colors"
                      disabled={inviteCreating}
                    >
                      <Copy className="w-4 h-4" />
                      {inviteCreating ? 'Creating…' : 'Create Invite Link'}
                    </button>
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
                    {inviteError && (
                      <div className="px-3 py-2 text-xs text-destructive">{inviteError}</div>
                    )}
                    {showAddFriends && (
                      <div className="p-2 border-t mt-1">
                        <div className="text-xs mb-2">Select friends to add</div>
                        <div className="space-y-2 max-h-40 overflow-auto pr-1">
                          {friends.length === 0 ? (
                            <p className="text-xs text-foreground/60">No accepted friends found.</p>
                          ) : (
                            friends.map((f) => (
                              <div key={f.id || f.friend_id} className="flex items-center justify-between text-xs">
                                <span>{f.display_name || f.username || 'Friend'}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full h-7"
                                  onClick={async () => {
                                    const uid = f.id || f.friend_id
                                    if (!uid || !roomId) return
                                    try {
                                      await supabase.from('room_members').insert({ room_id: roomId, user_id: uid })
                                    } catch {}
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {inviteToken && (
                      <div className="p-2">
                        <div className="text-xs mb-1">Invite Link</div>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}?token=${inviteToken}`} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}?token=${inviteToken}`
                              navigator.clipboard.writeText(url).catch(() => {})
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <Dialog.Root open={showAddFriends} onOpenChange={(o) => { setShowAddFriends(!!o) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[60]" />
          <Dialog.Content className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-xl border border-border bg-card p-4 shadow-lg">
            <Dialog.Title className="font-semibold text-base">Add Friends</Dialog.Title>
            <Dialog.Description className="text-xs text-foreground/60 mb-3">Select friends to add to this private room.</Dialog.Description>
            <Input
              placeholder="Search friends..."
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              className="mb-2"
            />
            {friends.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={friends.filter((f: any) => (f.display_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase())).every((f: any) => selectedFriendIds.includes(f.id || f.friend_id || f.user_id)) && friends.filter((f: any) => (f.display_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase())).length > 0}
                    onChange={(e) => {
                      const filtered = friends.filter((f: any) => (f.display_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase()))
                      const ids = filtered.map((f: any) => f.id || f.friend_id || f.user_id)
                      if (e.target.checked) {
                        setSelectedFriendIds((prev) => Array.from(new Set([...prev, ...ids])))
                      } else {
                        setSelectedFriendIds((prev) => prev.filter((x) => !ids.includes(x)))
                      }
                    }}
                  />
                  Select All
                </label>
                <Button variant="outline" size="sm" className="rounded-full h-7" onClick={() => setSelectedFriendIds([])}>Select None</Button>
              </div>
            )}
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {friends.length === 0 ? (
                <p className="text-xs text-foreground/60">No accepted friends found.</p>
              ) : (
                friends
                  .filter((f) => (f.display_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase()))
                  .map((f) => {
                  const id = f.id || f.friend_id
                  const name = f.display_name || f.username || 'Friend'
                  const checked = selectedFriendIds.includes(id)
                  return (
                    <label key={id} className="flex items-center gap-3 text-sm">
                      <img src={f.avatar_url || '/placeholder.svg'} alt={name} className="w-6 h-6 rounded-full" />
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedFriendIds((prev) => e.target.checked ? [...prev, id] : prev.filter((x) => x !== id))
                        }}
                      />
                      {name}
                    </label>
                  )
                })
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="rounded-full">Cancel</Button>
              </Dialog.Close>
                <Button size="sm" className="rounded-full bg-primary" onClick={handleAddSelectedFriends} loading={addingFriends}>Add Selected</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {joinError && (
        <div role="alert" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg">
          {joinError}
        </div>
      )}

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
                      showAvatar={!(msg.profiles?.username || '').startsWith('Guest')}
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
          <p className="text-foreground/60 mb-1.5 sm:mb-2 text-xs sm:text-base">Sign in or continue as a guest user.</p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/auth">
              <Button size="sm" className="text-xs sm:text-sm h-7 sm:h-9">Sign In</Button>
            </Link>
            <Link href="/guest">
              <Button variant="outline" size="sm" className="h-7 sm:h-9 rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Join as Guest
              </Button>
            </Link>
          </div>
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
                onClick={() => { if (isGuestUser) { pushSystemMessage('Create an account to upload images'); } else { fileInputRef.current?.click() } }}
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
                loading={sending || uploadingMedia}
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
