import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Star, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AddFriendButton } from '@/components/add-friend-button'

export const dynamic = 'force-dynamic'

export default async function FriendProfile({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(params)
  const friendId = resolvedParams.id

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  // Get friend profile
  const { data: friendProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendId)
    .single()

  if (error || !friendProfile) {
    redirect('/profile')
  }

  // Check if already friends
  const { data: friendship } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              💬
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChatBloom
            </h1>
          </Link>
          <Link href="/profile">
            <Button size="sm" variant="outline" className="rounded-full">
              Back to Profile
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-xl" />
          <Card className="relative p-8 md:p-12 bg-gradient-to-br from-card to-card/50">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 border-primary/50 overflow-hidden shadow-lg mb-4">
                  <img
                    src={friendProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendProfile.username}`}
                    alt="Friend avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="md:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">{friendProfile.display_name || friendProfile.username}</h2>
                <p className="text-foreground/70 mb-4">@{friendProfile.username}</p>
                <p className="text-foreground/70 mb-4">{friendProfile.bio || 'No bio yet'}</p>
                <div className="flex gap-4 text-sm text-foreground/70 mb-4">
                  {friendProfile.gender && <span>Gender: {friendProfile.gender}</span>}
                  {typeof friendProfile.age === 'number' && <span>Age: {friendProfile.age}</span>}
                </div>
                <div className="flex gap-2">
                  {friendship?.status === 'accepted' ? (
                    <Button size="sm" variant="outline" className="rounded-full" disabled>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Friends
                    </Button>
                  ) : friendship?.status === 'pending' ? (
                    <Button size="sm" variant="outline" className="rounded-full" disabled>
                      Request Pending
                    </Button>
                  ) : (
                    <AddFriendButton friendId={friendId} />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Level', value: friendProfile.level || 1, icon: Crown, color: 'from-primary to-accent' },
            { label: 'XP', value: (friendProfile.xp_points || 0).toLocaleString(), icon: Star, color: 'from-accent to-primary' },
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
      </div>
    </div>
  )
}

