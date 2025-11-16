'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Globe, Lock, Key, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateRoom() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    language: 'English',
    privacy: 'public' as 'public' | 'private' | 'invite',
  })

  const [step, setStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Portuguese']
  
  const topics = [
    { name: 'General', emoji: '💬' },
    { name: 'Gaming', emoji: '🎮' },
    { name: 'Art & Design', emoji: '🎨' },
    { name: 'Technology', emoji: '💻' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Learning', emoji: '📚' },
    { name: 'Sports', emoji: '⚽' },
    { name: 'Food', emoji: '🍕' },
  ]

  const privacyOptions = [
    {
      id: 'public',
      icon: Globe,
      title: 'Public',
      desc: 'Anyone can discover and join',
      badge: 'Recommended',
    },
    {
      id: 'private',
      icon: Lock,
      title: 'Private',
      desc: 'Only invited members can join',
      badge: 'Exclusive',
    },
    {
      id: 'invite',
      icon: Key,
      title: 'Invite Only',
      desc: 'Share unique invite link with friends',
      badge: 'Limited',
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrivacySelect = (privacy: 'public' | 'private' | 'invite') => {
    setFormData(prev => ({
      ...prev,
      privacy,
    }))
  }

  const handleCreate = async () => {
    if (!isFormValid) return

    setLoading(true)
    setError(null)

    try {
      // Get emoji from selected topic
      const selectedTopic = topics.find(t => t.name === formData.topic)
      const emoji = selectedTopic?.emoji || '💬'

      // Map privacy to is_public and is_private booleans
      const is_public = formData.privacy === 'public'
      const is_private = formData.privacy === 'private' || formData.privacy === 'invite'

      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          topic: formData.topic,
          emoji,
          is_public,
          is_private,
          language: formData.language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, redirect to auth page
          router.push('/auth')
          return
        }
        throw new Error(data.error || 'Failed to create room')
      }

      // Redirect to the created room
      router.push(`/room/${data.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      setError(message)
      console.error('Error creating room:', err)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.topic

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                💬
              </div>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Room
            </h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar - Steps */}
          <div className="hidden md:block">
            <Card className="sticky top-24 p-6 bg-card/50 backdrop-blur">
              <h3 className="font-bold text-lg mb-6">Create Your Room</h3>
              <div className="space-y-4">
                {[
                  { num: 1, title: 'Room Details', desc: 'Name & Description' },
                  { num: 2, title: 'Privacy Settings', desc: 'Who can join' },
                  { num: 3, title: 'Review & Create', desc: 'Confirm settings' },
                ].map((s) => (
                  <div key={s.num} className={`flex gap-3 p-3 rounded-lg transition-all ${
                    step === s.num ? 'bg-primary/20 border border-primary/50' : 'opacity-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      step === s.num ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {s.num}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-foreground/60">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2">
            {/* Step 1: Room Details */}
            {step === 1 && (
              <Card className="p-8 animate-in fade-in">
                <h2 className="text-2xl font-bold mb-8">What's your room about?</h2>
                
                <div className="space-y-6">
                  {/* Room Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-3">Room Name</label>
                    <Input
                      name="name"
                      placeholder="e.g., Gaming Squad, Study Buddies"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-foreground/50 mt-2">Choose a catchy, memorable name</p>
                  </div>

                  {/* Topic Selection */}
                  <div>
                    <label className="block text-sm font-semibold mb-3">Topic</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {topics.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setFormData(prev => ({ ...prev, topic: t.name }))}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.topic === t.name
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-2">{t.emoji}</div>
                          <p className="text-xs font-medium">{t.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-semibold mb-3">Primary Language</label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-3">Description</label>
                    <textarea
                      name="description"
                      placeholder="Tell people what your room is about..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-foreground/50 mt-2">{formData.description.length}/200 characters</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-6">
                    <Button variant="outline" className="rounded-full" onClick={() => window.history.back()}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                      onClick={() => setStep(2)}
                    >
                      Next: Privacy Settings
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Privacy Settings */}
            {step === 2 && (
              <Card className="p-8 animate-in fade-in">
                <h2 className="text-2xl font-bold mb-8">Who can join your room?</h2>

                <div className="space-y-4 mb-8">
                  {privacyOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => handlePrivacySelect(option.id as 'public' | 'private' | 'invite')}
                        className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                          formData.privacy === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              formData.privacy === option.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-accent/20 text-accent'
                            }`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{option.title}</h3>
                              <p className="text-sm text-foreground/60">{option.desc}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            formData.privacy === option.id
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-foreground/60'
                          }`}>
                            {option.badge}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                    onClick={() => setStep(3)}
                  >
                    Review & Create
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <Card className="p-8 animate-in fade-in">
                <h2 className="text-2xl font-bold mb-8">Ready to create?</h2>

                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6 mb-8">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/20">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Room Preview
                    </h3>
                    
                    <Card className="p-6 bg-card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-4xl mb-2">
                            {topics.find(t => t.name === formData.topic)?.emoji || '💬'}
                          </div>
                          <h4 className="text-2xl font-bold">{formData.name || 'Your Room'}</h4>
                          <p className="text-sm text-foreground/60 mt-1">{formData.topic} • {formData.language}</p>
                        </div>
                        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-400">
                          {privacyOptions.find(p => p.id === formData.privacy)?.badge}
                        </div>
                      </div>
                      {formData.description && (
                        <p className="text-sm text-foreground/70 mt-4">{formData.description}</p>
                      )}
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Privacy Level:</span>
                      <span className="font-semibold capitalize">{formData.privacy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Default Language:</span>
                      <span className="font-semibold">{formData.language}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-full"
                    onClick={handleCreate}
                    disabled={!isFormValid || loading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
