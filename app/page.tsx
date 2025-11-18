'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Heart, Users, Sparkles, MessageCircle, LogOut, User, Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface RoomMember {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

interface RoomCreator {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

interface Room {
  id: string
  name: string
  description?: string
  topic: string
  emoji: string
  is_public: boolean
  member_count: number
  max_members?: number
  members?: RoomMember[]
  liveCount?: number
  creator?: RoomCreator
}

export default function Home() {
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [capacityFilter, setCapacityFilter] = useState<'any' | 'available' | 'full'>('any')
  const [sortBy, setSortBy] = useState<'most_active' | 'recent' | 'alphabetical'>('most_active')
  const isGuestUser = !!user && (((user as any).is_anonymous) || ((user as any).app_metadata?.provider === 'anonymous'))
  const [guestError, setGuestError] = useState<string | null>(null)
  const [startingGuest, setStartingGuest] = useState(false)
  const router = useRouter()
  const supabaseDirect = createClient()
  const [authNav, setAuthNav] = useState(false)
  const goAuth = () => { if (!authNav) { setAuthNav(true); router.replace('/auth') } }
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [showCleanupWarn, setShowCleanupWarn] = useState(false)
  const [cleanupRunning, setCleanupRunning] = useState(false)
  const [staleCount, setStaleCount] = useState(0)
  const devCheckAbortRef = useRef<AbortController | null>(null)
  const cleanupAbortRef = useRef<AbortController | null>(null)
  const handleCreateRoomClick = () => {
    if (!user || isGuestUser) {
      setGuestError('Please create an account to create rooms')
      setShowAccountPrompt(true)
      setTimeout(() => {
        setShowAccountPrompt(false)
        goAuth()
      }, 1500)
      return
    }
    router.push('/create-room')
  }
  const handleStartGuest = async () => {
    setGuestError(null)
    setStartingGuest(true)
    try {
      let { data, error } = await supabaseDirect.auth.signInAnonymously()
      if (error) {
        try { console.error('[home] anonymous sign-in error:', error) } catch {}
        // Retry once after ensuring no existing session
        try {
          await supabaseDirect.auth.signOut()
          const retry = await supabaseDirect.auth.signInAnonymously()
          data = retry.data
          error = retry.error
        } catch {}
      }
      if (error) {
        const msg = (error as any)?.message || 'Guest sign-in failed. Please sign in to continue.'
        setGuestError(msg)
        setTimeout(() => {
          goAuth()
        }, 1500)
        return
      }
      const u = data?.user
      if (u?.id) {
        const username = `Guest-${Math.floor(Math.random()*10000)}`
        await supabaseDirect
          .from('profiles')
          .upsert({ id: u.id, username, display_name: username })
        setUser(u)
      } else {
        setGuestError('Guest session unavailable. Please sign in to continue.')
        setTimeout(() => {
          goAuth()
        }, 1500)
      }
    } catch (e) {
      try { console.error('[home] unexpected error:', e) } catch {}
      const msg = e instanceof Error ? e.message : 'Unexpected error. Please sign in to continue.'
      setGuestError(msg)
      setTimeout(() => {
        goAuth()
      }, 1500)
    } finally {
      setStartingGuest(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    const fetchRooms = async () => {
      try {
        const { data: rooms, error } = await supabase
          .from('rooms')
          .select(`
            *,
            creator:profiles!rooms_created_by_fkey (
              id,
              username,
              display_name,
              avatar_url
            ),
            room_members (
              user_id,
              profiles (
                id,
                username,
                display_name,
                avatar_url
              )
            )
          `)
          .eq('is_public', true)
          .limit(50)

        if (error) throw error
        
        const roomsWithMembers = (rooms || []).map((room: any) => {
          const members = room.room_members?.slice(0, 4).map((rm: any) => rm.profiles).filter(Boolean) || []
          const liveCount = Array.isArray(room.room_members) ? room.room_members.length : members.length
          const creator = room.creator ? {
            id: room.creator.id,
            username: room.creator.username,
            display_name: room.creator.display_name,
            avatar_url: room.creator.avatar_url,
          } : undefined
          return { ...room, members, liveCount, creator }
        })
        
        setPublicRooms(roomsWithMembers)
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
        // Fall back to demo rooms if database is empty
        setPublicRooms([
          { id: '1', name: 'General Chat', description: '', topic: 'General Discussion', emoji: '💬', is_public: true, member_count: 2543, max_members: 8, members: [] },
          { id: '2', name: 'Gaming Hub', description: '', topic: 'Video Games', emoji: '🎮', is_public: true, member_count: 1843, max_members: 8, members: [] },
          { id: '3', name: 'Creative Corner', description: '', topic: 'Art & Design', emoji: '🎨', is_public: true, member_count: 892, max_members: 8, members: [] },
          { id: '4', name: 'Tech Talk', description: '', topic: 'Technology', emoji: '💻', is_public: true, member_count: 1234, max_members: 8, members: [] },
          { id: '5', name: 'Music Vibes', description: '', topic: 'Music & Podcasts', emoji: '🎵', is_public: true, member_count: 567, max_members: 8, members: [] },
          { id: '6', name: 'Study Squad', description: '', topic: 'Learning Together', emoji: '📚', is_public: true, member_count: 3421, max_members: 8, members: [] },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchRooms().then(async () => {
      try {
        

        const roomIds = (publicRooms || []).map((r) => r.id)
        if (roomIds.length === 0) return

        const channel = supabase
          .channel('rooms-live')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_members' }, async (payload) => {
            const roomId = payload.new?.room_id
            const userId = payload.new?.user_id
            if (!roomId || !userId) return
            setPublicRooms((prev) => {
              const idx = prev.findIndex((r) => r.id === roomId)
              if (idx === -1) return prev
              const room = prev[idx]
              const exists = room.members?.some((m) => (m as any)?.id === userId || (m as any)?.user_id === userId)
              const nextMembers = room.members ? [...room.members] : []
              if (!exists) {
                // Fetch profile for avatar
                supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', userId)
                  .single()
                  .then(({ data }) => {
                    if (!data) return
                    setPublicRooms((prev2) => {
                      const i2 = prev2.findIndex((r) => r.id === roomId)
                      if (i2 === -1) return prev2
                      const r2 = prev2[i2]
                      const mems = r2.members ? [...r2.members] : []
                      const already = mems.some((m: any) => m.id === data.id)
                      if (!already) mems.unshift({ id: data.id, username: data.username, display_name: data.display_name, avatar_url: data.avatar_url })
                      return [
                        ...prev2.slice(0, i2),
                        { ...r2, members: mems.slice(0, 4), liveCount: (r2.liveCount || 0) + 1 },
                        ...prev2.slice(i2 + 1),
                      ]
                    })
                  })
              }
              return [
                ...prev.slice(0, idx),
                { ...room, liveCount: (room.liveCount || 0) + (exists ? 0 : 1) },
                ...prev.slice(idx + 1),
              ]
            })
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_members' }, async (payload) => {
            const roomId = payload.old?.room_id
            const userId = payload.old?.user_id
            if (!roomId || !userId) return
            setPublicRooms((prev) => {
              const idx = prev.findIndex((r) => r.id === roomId)
              if (idx === -1) return prev
              const room = prev[idx]
              const mems = (room.members || []).filter((m: any) => m.id !== userId && m.user_id !== userId)
              const nextCount = Math.max(0, (room.liveCount || 0) - 1)
              return [
                ...prev.slice(0, idx),
                { ...room, members: mems, liveCount: nextCount },
                ...prev.slice(idx + 1),
              ]
            })
          })
          .subscribe()

        // Cleanup
        return () => {
          supabase.removeChannel(channel)
        }
      } catch {}
    })
    checkUser()

    const checkCleanup = async () => {
      if (process.env.NODE_ENV !== 'development') return
      try {
        const ac = new AbortController()
        devCheckAbortRef.current = ac
        const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
        let count = 0
        const r1 = await supabase
          .from('room_members')
          .select('id', { count: 'exact', head: true })
          .abortSignal(ac.signal)
          .lt('last_seen', cutoff)
        count += r1.count || 0
        if (count === 0) {
          const r2 = await supabase
            .from('room_members')
            .select('id', { count: 'exact', head: true })
            .abortSignal(ac.signal)
            .lt('joined_at', cutoff)
          count += r2.count || 0
        }
        setStaleCount(count)
        setShowCleanupWarn(count > 0)
      } catch {}
    }
    checkCleanup()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
      try { devCheckAbortRef.current?.abort() } catch {}
      try { cleanupAbortRef.current?.abort() } catch {}
    }
  }, [])

  useEffect(() => {
    if (!showCleanupWarn) return
    const t = window.setTimeout(() => setShowCleanupWarn(false), 6000)
    return () => { try { window.clearTimeout(t) } catch {} }
  }, [showCleanupWarn])

  const runDevCleanup = async () => {
    try {
      setCleanupRunning(true)
      cleanupAbortRef.current?.abort()
      const ctrl = new AbortController()
      cleanupAbortRef.current = ctrl
      const res = await fetch('/api/room-members/cleanup?minutes=2', { method: 'POST', signal: ctrl.signal })
      if (res.ok) {
        await new Promise((r) => setTimeout(r, 500))
        const supabase = createClient()
        const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
        let count = 0
        const r1 = await supabase
          .from('room_members')
          .select('id', { count: 'exact', head: true })
          .abortSignal(ctrl.signal)
          .lt('last_seen', cutoff)
        count += r1.count || 0
        if (count === 0) {
          const r2 = await supabase
            .from('room_members')
            .select('id', { count: 'exact', head: true })
            .abortSignal(ctrl.signal)
            .lt('joined_at', cutoff)
          count += r2.count || 0
        }
        setStaleCount(count)
        setShowCleanupWarn(count > 0)
      }
    } finally {
      setCleanupRunning(false)
    }
  }

  const runDevMessageCleanup = async () => {
    try {
      setCleanupRunning(true)
      cleanupAbortRef.current?.abort()
      const ctrl = new AbortController()
      cleanupAbortRef.current = ctrl
      const res = await fetch('/api/chat/cleanup?days=30', { method: 'POST', signal: ctrl.signal })
      if (res.ok) {
        setShowCleanupWarn(true)
        setTimeout(() => setShowCleanupWarn(false), 2000)
      }
    } finally {
      setCleanupRunning(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (err) {
      console.error('Failed to sign out:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              💬
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChatBloom
            </h1>
          </div>
          {/* Desktop actions */}
          <div className="hidden sm:flex gap-3 items-center">
            <ThemeToggle />
            {user && !isGuestUser ? (
              <>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="sm" className="rounded-full">
                  Sign In
                </Button>
              </Link>
            )}
            <Button size="sm" className="bg-accent hover:bg-accent/90 rounded-full" onClick={handleCreateRoomClick} aria-label="Create Room">
              Create Room
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setShowMobileMenu((v) => !v)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-[45] bg-background/40" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-14 left-0 right-0 z-[50] px-3">
            <div className="bg-card border border-border rounded-2xl shadow-lg p-3 grid grid-cols-1 gap-2">
              {user && !isGuestUser ? (
                <>
                  <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
                    <Button variant="outline" className="w-full rounded-full justify-start">
                      <User className="w-4 h-4 mr-2" /> Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full rounded-full justify-start" onClick={() => { setShowMobileMenu(false); handleSignOut() }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="outline" className="w-full rounded-full justify-start">Sign In</Button>
                </Link>
              )}
              <Button className="w-full rounded-full bg-accent hover:bg-accent/90 justify-start" onClick={() => { setShowMobileMenu(false); handleCreateRoomClick() }} aria-label="Create Room">Create Room</Button>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center md:text-left">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                  <span className="text-balance">Connect, Chat &</span>
                  <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Celebrate Together
                  </span>
                </h2>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-none sm:max-w-lg mx-auto md:mx-0">
                  Join vibrant chat rooms, connect with friends 1-on-1, and earn rewards as you grow. Experience chatting reimagined with a fun, cartoon-style interface.
                </p>
              </div>

              <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
                <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full font-semibold px-8 min-w-[200px]" onClick={handleCreateRoomClick} aria-label="Create Room">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
                {!user && (
                  <Button size="lg" variant="outline" className="rounded-full font-semibold px-8 min-w-[200px]" onClick={handleStartGuest} disabled={startingGuest} aria-label="Join as Guest">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {startingGuest ? 'Starting…' : 'Join as Guest'}
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-4">
                  <p className="text-2xl font-bold text-primary">Hello  </p>
                  <p className="text-sm text-foreground/70">Users</p>
                </div>
                <div className="bg-accent/10 dark:bg-accent/20 rounded-2xl p-4">
                  <p className="text-2xl font-bold text-accent">{publicRooms.length}+</p>
                  <p className="text-sm text-foreground/70">Chat Rooms</p>
                </div>
              </div>
            </div>

            {/* Right Hero Illustration - hidden on mobile */}
            <div className="relative h-56 md:h-64 hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative flex items-center justify-center h-full">
                <div className="w-44 h-44 md:w-56 md:h-56 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl shadow-2xl flex items-center justify-center animate-float">
                  <div className="text-center">
                    <p className="text-5xl md:text-6xl mb-2 md:mb-4">💬</p>
                    <p className="text-white font-bold text-base md:text-lg">Chat Magic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating bubbles - hidden on mobile */}
        <div className="hidden md:block absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="hidden md:block absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="hidden md:block absolute top-1/2 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      </section>
      {showAccountPrompt && (
        <div role="alert" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
          Create Account to create rooms
        </div>
      )}
      {showCleanupWarn && (
        <div role="alert" aria-live="polite" className="fixed top-14 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg">
          <span>Presence cleanup not detected ({staleCount}) – dev only</span>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={runDevCleanup}
              disabled={cleanupRunning}
              className="ml-3 inline-flex items-center rounded-full border border-destructive-foreground/30 px-3 py-1 text-xs hover:bg-destructive-foreground hover:text-destructive"
            >
              {cleanupRunning ? 'Cleaning…' : 'Run cleanup'}
            </button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={runDevMessageCleanup}
              disabled={cleanupRunning}
              className="ml-2 inline-flex items-center rounded-full border border-destructive-foreground/30 px-3 py-1 text-xs hover:bg-destructive-foreground hover:text-destructive"
            >
              {cleanupRunning ? 'Cleaning…' : 'Cleanup Old Chats (30d)'}
            </button>
          )}
        </div>
      )}

      {/* Public Rooms Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-2">Explore Chat Rooms</h3>
            <p className="text-foreground/60">Find rooms by name, topic, and availability</p>
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search rooms by name or topic"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full h-10 text-sm flex-1"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-1 -mx-1 px-1">
                <Button variant={capacityFilter === 'any' ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setCapacityFilter('any')}>Any</Button>
                <Button variant={capacityFilter === 'available' ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setCapacityFilter('available')}>Available</Button>
                <Button variant={capacityFilter === 'full' ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setCapacityFilter('full')}>Full</Button>
              </div>
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-1 -mx-1 px-1">
                {['all','General','Gaming','Art & Design','Technology','Music','Learning','Sports','Food'].map((t) => (
                  <Button key={t} variant={selectedTopic === t ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setSelectedTopic(t)}>
                    {t === 'all' ? 'All Topics' : t}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant={sortBy === 'most_active' ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setSortBy('most_active')}>Most Active</Button>
                <Button variant={sortBy === 'alphabetical' ? 'default' : 'outline'} size="sm" className="rounded-full px-3" onClick={() => setSortBy('alphabetical')}>A–Z</Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {publicRooms
                .filter((room) => {
                  const q = searchQuery.trim().toLowerCase()
                  const inSearch = q === '' || room.name.toLowerCase().includes(q) || (room.topic || '').toLowerCase().includes(q)
                  const topicOk = selectedTopic === 'all' || (room.topic || '').toLowerCase() === selectedTopic.toLowerCase()
                  const available = ((room.max_members ?? 8) - (room.liveCount ?? 0)) > 0
                  const capacityOk = capacityFilter === 'any' ? true : capacityFilter === 'available' ? available : !available
                  return inSearch && topicOk && capacityOk
                })
                .sort((a, b) => {
                  if (sortBy === 'alphabetical') return a.name.localeCompare(b.name)
                  return (b.liveCount ?? 0) - (a.liveCount ?? 0)
                })
                .map((room) => (
                  <Card key={room.id} onClick={() => router.push(`/room/${room.id}`)} className="p-4 sm:p-6 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/50 h-full">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="text-3xl sm:text-5xl">{room.emoji}</div>
                      <div className="bg-primary/10 dark:bg-primary/20 text-primary rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold group-hover:scale-110 transition-transform">
                        {(room.liveCount ?? 0)}/{room.max_members ?? 8}
                      </div>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold mb-1 text-balance group-hover:text-primary transition-colors">{room.name}</h4>
                    <p className="text-xs sm:text-sm text-foreground/60 mb-2 sm:mb-3">{room.topic}</p>

                    {room.creator && (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background overflow-hidden bg-primary/20 flex items-center justify-center">
                          {room.creator.avatar_url ? (
                            <img src={room.creator.avatar_url} alt={room.creator.display_name || room.creator.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-foreground/70">
                              {(room.creator.display_name || room.creator.username || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm text-foreground/70">
                          Admin {room.creator.display_name || room.creator.username}
                        </span>
                      </div>
                    )}
                    
                    {/* Member Avatars */}
                    {room.members && room.members.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="flex -space-x-2 overflow-x-auto max-w-full pr-1">
                          {room.members.slice(0, 8).map((member, idx) => (
                            <div
                              key={member.id || idx}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background overflow-hidden bg-accent/20 flex items-center justify-center"
                              title={member.display_name || member.username}
                            >
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.display_name || member.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs sm:text-sm font-semibold text-foreground/70">
                                  {(member.display_name || member.username || '?').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {(room.liveCount ?? room.member_count ?? 0) > 8 && (
                          <span className="text-xs sm:text-sm text-foreground/60">
                            +{(room.liveCount ?? room.member_count ?? 0) - 8} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 rounded-full text-xs sm:text-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/room/${room.id}`)
                      }}
                    >
                      {((room.max_members ?? 8) - (room.liveCount ?? 0)) <= 0 ? 'Full – View' : 'Join Now'}
                    </Button>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section - hidden on mobile */}
      <section className="py-12 md:py-20 bg-primary/5 dark:bg-primary/10 border-t border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why ChatBloom?</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MessageCircle, title: 'Group Chats', desc: 'Chat with thousands in public rooms' },
              { icon: Heart, title: 'Reactions', desc: 'React with stickers, emojis & GIFs' },
              { icon: Users, title: 'Direct Messages', desc: '1-on-1 conversations with friends' },
              { icon: Sparkles, title: 'Rewards', desc: 'Earn XP, badges & level up' },
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm text-foreground/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - hidden on mobile */}
      <section className="py-12 md:py-20 hidden md:block">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-6 md:p-12 text-center text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Conversation?</h3>
            <p className="text-lg opacity-90 mb-8">Start chatting now, no credit card required</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8">
                  Create an Account
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="rounded-full font-semibold px-8 text-white border-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
