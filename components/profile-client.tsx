'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heart, Trophy, Crown, Edit2, LogOut, MessageCircle, UserPlus, Upload, X, Search, Users, Check, UserX } from 'lucide-react'
import Link from 'next/link'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  bio?: string
  xp_points: number
  level: number
  gender?: string
  age?: number
}

interface Friend {
  id: string
  friend_id: string
  user_id?: string
  friend_id_raw?: string
  username: string
  display_name: string
  avatar_url?: string
  bio?: string
  status: string
  created_at: string
}

export default function ProfileClient({ initialProfile, userId }: { initialProfile: Profile; userId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [selectedAvatar, setSelectedAvatar] = useState(initialProfile?.avatar_url || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [loadingPending, setLoadingPending] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const friendsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const [isGuestUser, setIsGuestUser] = useState(false)
  const [ownedRooms, setOwnedRooms] = useState<any[]>([])
  const [recentRooms, setRecentRooms] = useState<any[]>([])

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user6',
  ]

  const badges = [
    { id: 1, name: 'Early Bird', icon: '🌅', desc: 'First 100 users' },
    { id: 2, name: 'Chattier', icon: '💬', desc: '500+ messages' },
    { id: 3, name: 'Popular', icon: '⭐', desc: '1000+ followers' },
    { id: 4, name: 'Room Creator', icon: '🏠', desc: 'Created 5+ rooms' },
  ]

  // Load friends on mount
  useEffect(() => {
    loadFriends()
    loadPendingRequests()
    loadOwnedRooms()
    loadRecentRooms()
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const guest = !!user && (((user as any).is_anonymous) || ((user as any).app_metadata?.provider === 'anonymous'))
      setIsGuestUser(!!guest)
    }
    getUser()
  }, [supabase])

  const loadFriends = async () => {
    try {
      setLoadingFriends(true)
      const response = await fetch('/api/friends/get?status=accepted')
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (err) {
      console.error('Error loading friends:', err)
    }
    finally {
      setLoadingFriends(false)
    }
  }

  const loadPendingRequests = async () => {
    try {
      setLoadingPending(true)
      const response = await fetch('/api/friends/get?status=pending')
      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data.friends || [])
      }
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
    finally {
      setLoadingPending(false)
    }
  }

  const loadOwnedRooms = async () => {
    try {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(8)
      setOwnedRooms(data || [])
    } catch { }
  }

  const loadRecentRooms = async () => {
    try {
      const { data } = await supabase
        .from('room_members')
        .select('room_id, joined_at, rooms(*)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(8)
      const rows = (data || []) as any[]
      const mapped = rows
        .map((r) => ({ joined_at: r.joined_at, room: (r as any).rooms }))
        .filter((x) => x.room)
      setRecentRooms(mapped)
    } catch { }
  }

  useEffect(() => {
    if (showFriends) {
      friendsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showFriends])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setSelectedAvatar(data.avatar_url)
      setProfile({ ...profile, avatar_url: data.avatar_url })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image'
      setError(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .neq('id', userId)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error('Error searching users:', err)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      handleSearchUsers()
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleAddFriend = async (friendId: string) => {
    try {
      setError(null)
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add friend')
      }

      setSearchQuery('')
      setSearchResults([])
      loadPendingRequests()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add friend'
      setError(message)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setPendingActionId(requestId)
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_request_id: requestId }),
      })

      if (!response.ok) throw new Error('Failed to accept request')

      loadFriends()
      loadPendingRequests()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept request'
      setError(message)
    } finally {
      setPendingActionId(null)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setPendingActionId(requestId)
      const response = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_request_id: requestId }),
      })
      if (!response.ok) throw new Error('Failed to decline request')
      loadPendingRequests()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline request'
      setError(message)
    } finally {
      setPendingActionId(null)
    }
  }

  const confirmRemoveFriend = async () => {
    if (!removeTarget) return
    try {
      setRemoving(true)
      const response = await fetch(`/api/friends/remove?friend_id=${removeTarget}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to remove friend')
      setRemoveTarget(null)
      loadFriends()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove friend'
      setError(message)
    } finally {
      setRemoving(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setError(null)
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: isGuestUser ? null : selectedAvatar,
          gender: profile.gender,
          age: profile.age ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              💬
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Chat2077
            </h1>
          </Link>
          <Button size="sm" className="bg-accent hover:bg-accent/90 rounded-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {error && (
          <Card className="p-4 mb-6 bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Profile Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-xl" />
          <Card className="relative p-8 md:p-12 bg-gradient-to-br from-card to-card/50">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 border-primary/50 overflow-hidden shadow-lg mb-4">
                  {isGuestUser ? (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                  ) : (
                    <img
                      src={selectedAvatar || "/placeholder.svg"}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {isEditing && !isGuestUser && (
                  <div className="space-y-3 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <p className="text-xs text-foreground/60 text-center">Or choose from presets</p>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 overflow-hidden transition-all ${selectedAvatar === avatar
                            ? 'border-primary scale-110'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <img src={avatar || "/placeholder.svg"} alt="Avatar option" className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 rounded-full text-xs sm:text-sm mt-2"
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="md:col-span-2">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Display Name</label>
                      <Input
                        value={profile.display_name || ''}
                        onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Gender</label>
                        <select
                          value={profile.gender || 'other'}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Age</label>
                        <Input
                          type="number"
                          value={profile.age || ''}
                          onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Bio</label>
                      <textarea
                        value={profile.bio || ''}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-4xl font-bold mb-2">{profile.display_name || profile.username}</h2>
                    <p className="text-foreground/70 mb-4">{profile.bio || 'No bio yet'}</p>
                    <div className="flex gap-4 text-sm text-foreground/70 mb-4">
                      {profile.gender && <span>Gender: {profile.gender}</span>}
                      {typeof profile.age === 'number' && <span>Age: {profile.age}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-semibold">
                        <Crown className="w-3 h-3" />
                        <span>Level {profile.level || 1}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-xs font-semibold">
                        <Trophy className="w-3 h-3" />
                        <span>{badges.length} Achievements</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 rounded-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setShowFriends(!showFriends)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Friends ({friends.length})
                        </Button>
                        {pendingRequests.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                            {pendingRequests.length} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>



        {/* Friends Section */}
        <div ref={friendsRef} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Friends</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFriends(!showFriends)}
              className="rounded-full"
            >
              {showFriends ? <X className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </Button>
          </div>

          {showFriends && (
            <Card className="p-4 sm:p-6">
              {/* Search Users */}
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search users by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchUsers} className="rounded-full">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-foreground/70">Search Results</p>
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                            alt={user.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{user.display_name || user.username}</p>
                            <p className="text-xs text-foreground/60">@{user.username}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddFriend(user.id)}
                          className="rounded-full"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.length === 0 && !!searchQuery.trim() && (
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-foreground/60">No results</div>
                  </div>
                )}

                {/* Pending Requests */}
                {loadingPending ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-foreground/70">Pending Requests</p>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 bg-accent/10 rounded-lg animate-pulse">
                        <div className="h-6 w-1/2 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : pendingRequests.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-foreground/70">Pending Requests</p>
                    {pendingRequests.map((request) => {
                      const isRecipient = request.friend_id_raw === userId
                      const otherId = isRecipient ? (request.user_id || '') : request.friend_id
                      return (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                          <Link href={otherId ? `/profile/${otherId}` : '#'} className="flex items-center gap-3">
                            <img
                              src={request.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username}`}
                              alt={request.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{request.display_name || request.username}</p>
                              <p className="text-xs text-foreground/60">@{request.username}</p>
                            </div>
                          </Link>
                          {isRecipient ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(request.id)}
                                loading={pendingActionId === request.id}
                                className="rounded-full"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeclineRequest(request.id)}
                                loading={pendingActionId === request.id}
                                className="rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeclineRequest(request.id)}
                                loading={pendingActionId === request.id}
                                className="rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                {/* Friends List */}
                {loadingFriends ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground/70 mb-2">Your Friends</p>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-3 bg-accent/10 rounded-lg animate-pulse">
                        <div className="h-6 w-1/3 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground/70 mb-2">Your Friends</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                          <Link href={`/profile/${friend.friend_id}`} className="flex items-center gap-3 flex-1">
                            <img
                              src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                              alt={friend.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{friend.display_name || friend.username}</p>
                              <p className="text-xs text-foreground/60">@{friend.username}</p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Link href={`/create-room?dm=${friend.friend_id}`}>
                              <Button size="sm" variant="outline" className="rounded-full">
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRemoveTarget(friend.friend_id)}
                              className="rounded-full"
                            >
                              <UserX className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-foreground/60 py-8">No friends yet. Search for users to add them!</p>
                )}
              </div>
            </Card>
          )}

          {/* Remove friend confirm dialog */}
          <AlertDialog.Root open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[70]" />
              <AlertDialog.Content className="fixed z-[71] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-[420px] rounded-xl border border-border bg-card p-4 shadow-lg">
                <AlertDialog.Title className="font-semibold text-base">Remove Friend</AlertDialog.Title>
                <AlertDialog.Description className="text-xs text-foreground/60 mt-2">This action will remove the user from your friends list.</AlertDialog.Description>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <Button variant="outline" size="sm" className="rounded-full">Cancel</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button size="sm" className="rounded-full bg-destructive text-destructive-foreground" onClick={confirmRemoveFriend} loading={removing}>Remove</Button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-6">Your Rooms</h3>
          <Card className="p-6">
            {ownedRooms.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {ownedRooms.map((room) => (
                  <div key={room.id} className="p-4 border border-border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{room.emoji || '💬'}</div>
                      <div>
                        <p className="font-semibold text-sm">{room.name}</p>
                        <p className="text-xs text-foreground/60">{room.topic}</p>
                      </div>
                    </div>
                    <Link href={`/room/${room.id}`}>
                      <Button size="sm" className="rounded-full">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-foreground/60">You don’t own any rooms yet.</p>
            )}
          </Card>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-6">Recently Joined</h3>
          <Card className="p-6">
            {recentRooms.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {recentRooms.map((row, i) => (
                  <div key={row.room.id + i} className="p-4 border border-border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{row.room.emoji || '💬'}</div>
                      <div>
                        <p className="font-semibold text-sm">{row.room.name}</p>
                        <p className="text-xs text-foreground/60">{row.room.topic}</p>
                      </div>
                    </div>
                    <Link href={`/room/${row.room.id}`}>
                      <Button size="sm" className="rounded-full">Open</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-foreground/60">No recent rooms joined.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
