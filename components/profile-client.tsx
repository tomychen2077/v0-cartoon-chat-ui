'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heart, Star, Trophy, Crown, Edit2, LogOut, MessageCircle, UserPlus, Upload, X, Search, Users, Check, UserX } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  bio?: string
  xp_points: number
  level: number
}

interface Friend {
  id: string
  friend_id: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

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
  }, [])

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends/get?status=accepted')
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (err) {
      console.error('Error loading friends:', err)
    }
  }

  const loadPendingRequests = async () => {
    try {
      const response = await fetch('/api/friends/get?status=pending')
      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data.friends || [])
      }
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
  }

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
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const response = await fetch(`/api/friends/remove?friend_id=${friendId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove friend')

      loadFriends()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove friend'
      setError(message)
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
          avatar_url: selectedAvatar,
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
              ChatBloom
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
                  <img 
                    src={selectedAvatar || "/placeholder.svg"} 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                  />
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
                {isEditing && (
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
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 overflow-hidden transition-all ${
                            selectedAvatar === avatar
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 rounded-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full"
                        onClick={() => setShowFriends(!showFriends)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Friends ({friends.length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Level', value: profile.level || 1, icon: Crown, color: 'from-primary to-accent' },
            { label: 'XP', value: (profile.xp_points || 0).toLocaleString(), icon: Star, color: 'from-accent to-primary' },
            { label: 'Messages', value: '0', icon: MessageCircle, color: 'from-secondary to-accent' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground/70">{stat.label}</h3>
                  <Icon className={`w-5 h-5 text-transparent bg-gradient-to-r ${stat.color} bg-clip-text`} />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </Card>
            )
          })}
        </div>

        {/* Badges Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Achievements</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <Card key={badge.id} className="p-6 text-center hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
                <div className="text-5xl mb-3 inline-block">{badge.icon}</div>
                <h4 className="font-bold mb-1">{badge.name}</h4>
                <p className="text-xs text-foreground/60">{badge.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Friends Section */}
        <div className="mb-12">
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

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-foreground/70">Pending Requests</p>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={request.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username}`}
                            alt={request.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{request.display_name || request.username}</p>
                            <p className="text-xs text-foreground/60">@{request.username}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="rounded-full"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friends List */}
                {friends.length > 0 ? (
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFriend(friend.friend_id)}
                            className="rounded-full"
                          >
                            <UserX className="w-4 h-4 text-destructive" />
                          </Button>
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
        </div>

        {/* Activity */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          <Card className="p-6">
            <div className="space-y-4">
              {[
                { type: 'room', text: 'Joined ChatBloom', time: 'Just now' },
                { type: 'message', text: 'Profile created', time: 'Just now' },
                { type: 'badge', text: 'Welcome to ChatBloom', time: 'Just now' },
                { type: 'level', text: 'Level 1', time: 'Just now' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {activity.type === 'room' && <MessageCircle className="w-5 h-5 text-primary" />}
                    {activity.type === 'message' && <Heart className="w-5 h-5 text-accent" />}
                    {activity.type === 'badge' && <Trophy className="w-5 h-5 text-amber-500" />}
                    {activity.type === 'level' && <Star className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.text}</p>
                    <p className="text-xs text-foreground/50">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
