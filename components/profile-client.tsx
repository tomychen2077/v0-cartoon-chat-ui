'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heart, Star, Trophy, Crown, Edit2, LogOut, MessageCircle, UserPlus } from 'lucide-react'
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

export default function ProfileClient({ initialProfile, userId }: { initialProfile: Profile; userId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [selectedAvatar, setSelectedAvatar] = useState(initialProfile?.avatar_url || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="w-40 h-40 rounded-3xl border-4 border-primary/50 overflow-hidden shadow-lg">
                      <img src={selectedAvatar || "/placeholder.svg"} alt="Avatar" className="w-full h-full" />
                    </div>
                    <p className="text-sm font-semibold text-foreground/70">Choose Avatar</p>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`w-12 h-12 rounded-xl border-2 overflow-hidden transition-all ${
                            selectedAvatar === avatar
                              ? 'border-primary scale-110'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img src={avatar || "/placeholder.svg"} alt="Avatar option" className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-3xl border-4 border-primary/50 overflow-hidden shadow-lg mb-4">
                    <img src={selectedAvatar || "/placeholder.svg"} alt="User avatar" className="w-full h-full" />
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
                  </div>
                ) : (
                  <div>
                    <h2 className="text-4xl font-bold mb-2">{profile.display_name || profile.username}</h2>
                    <p className="text-foreground/70 mb-4">{profile.bio || 'No bio yet'}</p>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 rounded-full"
                            onClick={handleSaveProfile}
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 rounded-full"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                          </Button>
                        </>
                      )}
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
