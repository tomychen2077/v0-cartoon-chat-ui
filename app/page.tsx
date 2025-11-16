export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Heart, Users, Sparkles, MessageCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

interface Room {
  id: string
  name: string
  description: string
  topic: string
  emoji: string
  is_public: boolean
  member_count: number
}

export default function Home() {
  const [isSignIn, setIsSignIn] = useState(false)
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('is_public', true)
          .limit(6)

        if (error) throw error
        setPublicRooms(data || [])
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
        // Fall back to demo rooms if database is empty
        setPublicRooms([
          { id: '1', name: 'General Chat', description: '', topic: 'General Discussion', emoji: '💬', is_public: true, member_count: 2543 },
          { id: '2', name: 'Gaming Hub', description: '', topic: 'Video Games', emoji: '🎮', is_public: true, member_count: 1843 },
          { id: '3', name: 'Creative Corner', description: '', topic: 'Art & Design', emoji: '🎨', is_public: true, member_count: 892 },
          { id: '4', name: 'Tech Talk', description: '', topic: 'Technology', emoji: '💻', is_public: true, member_count: 1234 },
          { id: '5', name: 'Music Vibes', description: '', topic: 'Music & Podcasts', emoji: '🎵', is_public: true, member_count: 567 },
          { id: '6', name: 'Study Squad', description: '', topic: 'Learning Together', emoji: '📚', is_public: true, member_count: 3421 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRooms()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              💬
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChatBloom
            </h1>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setIsSignIn(!isSignIn)} className="rounded-full">
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </Button>
            <Link href="/create-room">
              <Button size="sm" className="bg-accent hover:bg-accent/90 rounded-full">
                Create Room
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="text-balance">Connect, Chat &</span>
                  <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Celebrate Together
                  </span>
                </h2>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-lg">
                  Join vibrant chat rooms, connect with friends 1-on-1, and earn rewards as you grow. Experience chatting reimagined with a fun, cartoon-style interface.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create-room">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full font-semibold px-8 w-full">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Room
                  </Button>
                </Link>
                <Link href="/guest">
                  <Button size="lg" variant="outline" className="rounded-full font-semibold px-8 w-full">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Join as Guest
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
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

            {/* Right Hero Illustration */}
            <div className="relative h-96 md:h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative flex items-center justify-center h-full">
                <div className="w-64 h-64 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl shadow-2xl flex items-center justify-center animate-float">
                  <div className="text-center">
                    <p className="text-6xl mb-4">💬</p>
                    <p className="text-white font-bold text-lg">Chat Magic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating bubbles */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      </section>

      {/* Public Rooms Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-2">Explore Chat Rooms</h3>
            <p className="text-foreground/60">Join thousands in our most popular chat rooms</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRooms.map((room) => (
                <Link key={room.id} href={`/room/${room.id}`}>
                  <Card className="p-6 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/50 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{room.emoji}</div>
                      <div className="bg-primary/10 dark:bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-semibold group-hover:scale-110 transition-transform">
                        {room.member_count.toLocaleString()}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold mb-1 text-balance group-hover:text-primary transition-colors">{room.name}</h4>
                    <p className="text-sm text-foreground/60 mb-4">{room.topic}</p>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 rounded-full">
                      Join Now
                    </Button>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary/5 dark:bg-primary/10 border-t border-border">
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

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-12 text-center text-white">
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
