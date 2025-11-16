'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, ArrowRight, MessageCircle, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function GuestProfile() {
  const [guestUsername] = useState('Guest-' + Math.floor(Math.random() * 10000))
  const [guestAvatar] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=guest${Math.random()}`)

  const limitations = [
    { icon: '💬', text: 'Temporary Username' },
    { icon: '🏠', text: 'Limited Room Creation' },
    { icon: '📊', text: 'No Stats/Progress Tracking' },
    { icon: '🎮', text: 'View-Only Access to Some Features' },
  ]

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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 rounded-full">
              <LogOut className="w-4 h-4 mr-2" />
              Exit Guest
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Guest Card */}
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/30 mb-12">
          <div className="flex items-start justify-between mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary">GUEST MODE</span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-3xl border-4 border-primary/50 overflow-hidden shadow-lg">
                <img src={guestAvatar || "/placeholder.svg"} alt="Guest avatar" className="w-full h-full" />
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{guestUsername}</h2>
              <p className="text-foreground/70 mb-6">Explore ChatBloom as a guest. Create an account to unlock all features!</p>

              {/* Upgrade CTA */}
              <div className="bg-primary/20 border border-primary/40 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold mb-3">Ready to join permanently?</p>
                <Button className="w-full bg-primary hover:bg-primary/90 rounded-full font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Full Account
                </Button>
              </div>

              <Link href="/signin" className="text-sm text-primary hover:underline">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </Card>

        {/* Limitations Info */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Guest Limitations</h3>
          <p className="text-foreground/70 mb-6">As a guest, you have limited access to some features. Upgrade to unlock everything:</p>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {limitations.map((limit, i) => (
              <Card key={i} className="p-4 bg-card/50 border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{limit.icon}</span>
                  <p className="font-medium">{limit.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Feature Comparison</h3>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary/10 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-bold">Feature</th>
                    <th className="text-center p-4 font-bold">Guest</th>
                    <th className="text-center p-4 font-bold">Member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Chat in Rooms', '✓', '✓'],
                    ['Direct Messages', '✓', '✓'],
                    ['Send Reactions', '✓', '✓'],
                    ['Create Rooms', '◐', '✓'],
                    ['Permanent Profile', '✗', '✓'],
                    ['XP & Rewards', '✗', '✓'],
                    ['Badges & Achievements', '✗', '✓'],
                    ['Priority Support', '✗', '✓'],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-accent/5">
                      <td className="p-4">{row[0]}</td>
                      <td className="text-center p-4">
                        <span className={row[1] === '✓' ? 'text-green-500' : row[1] === '◐' ? 'text-yellow-500' : 'text-red-500'}>
                          {row[1]}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-green-500">{row[2]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
          <Card className="relative p-8 md:p-12 bg-gradient-to-r from-primary to-accent text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Start Your Journey Today</h3>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Create a free account and unlock all the features of ChatBloom. Build friendships, create rooms, and earn rewards!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="rounded-full font-semibold">
                Create Account
              </Button>
              <Button size="lg" variant="outline" className="rounded-full font-semibold text-white border-white hover:bg-white/10">
                Continue as Guest
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
