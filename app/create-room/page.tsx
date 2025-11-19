'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Globe, Lock, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateRoom() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    language: 'English',
    privacy: 'public' as 'public' | 'private',
    maxMembers: '',
  })
  const [noLimit, setNoLimit] = useState(false)

  const [step, setStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const searchParams = useSearchParams()
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const guest = !!user && (((user as any).is_anonymous) || ((user as any).app_metadata?.provider === 'anonymous'))
      if (!user || guest) {
        setError('Please create an account to create rooms')
        setTimeout(() => {
          router.replace('/auth')
        }, 1500)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const friendId = searchParams.get('dm') || searchParams.get('friend') || searchParams.get('prefillFriendId')
    if (friendId) {
      setFormData((prev) => ({ ...prev, privacy: 'private', topic: prev.topic || 'General', name: prev.name || '' }))
      loadFriends()
      setSelectedFriendIds((prev) => Array.from(new Set([...prev, friendId])))
      ;(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .eq('id', friendId)
          .single()
        const n = data?.display_name || data?.username
        if (n) {
          setFormData((prev) => ({ ...prev, name: prev.name || `Chat with ${n}` }))
        }
      })()
      setStep(2)
    }
  }, [searchParams])

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
  ]

  const languageCodes: Record<string, string> = {
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Japanese: 'ja',
    Korean: 'ko',
    Chinese: 'zh',
    Portuguese: 'pt',
  }

  const privacyOrder: Array<'public' | 'private'> = ['public', 'private']

  const handlePrivacyKeyNav = (current: 'public' | 'private', e: React.KeyboardEvent<HTMLButtonElement>) => {
    const i = privacyOrder.indexOf(current)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = privacyOrder[(i + 1) % privacyOrder.length]
      handlePrivacySelect(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = privacyOrder[(i - 1 + privacyOrder.length) % privacyOrder.length]
      handlePrivacySelect(prev)
    } else if (e.key === 'Home') {
      handlePrivacySelect(privacyOrder[0])
    } else if (e.key === 'End') {
      handlePrivacySelect(privacyOrder[privacyOrder.length - 1])
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handlePrivacySelect(current)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrivacySelect = (privacy: 'public' | 'private') => {
    setFormData(prev => ({
      ...prev,
      privacy,
    }))
    if (privacy === 'private') {
      loadFriends()
    }
  }

  const loadFriends = async () => {
    try {
      const res = await fetch('/api/friends/get?status=accepted')
      const data = await res.json()
      if (res.ok) {
        const list = ((data?.friends || data) as any[]) || []
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', list.map((f: any) => f.friend_id || f.user_id || f.id).filter((x: any) => !!x))
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
      }
    } catch {}
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
      const is_private = formData.privacy === 'private'

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
          language: languageCodes[formData.language] || 'en',
          max_members: noLimit ? null : (formData.maxMembers ? Number(formData.maxMembers) : null),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        if (response.status === 403) {
          setError('Please create an account to create rooms')
          setTimeout(() => {
            router.replace('/auth')
          }, 1500)
          return
        }
        throw new Error(data.error || 'Failed to create room')
      }

      if (formData.privacy !== 'public' && selectedFriendIds.length > 0) {
        const rows = selectedFriendIds.map((id) => ({ room_id: data.id, user_id: id }))
        await supabase.from('room_members').insert(rows)
        try {
          await fetch('/api/notifications/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipients: selectedFriendIds, type: 'room_member_added', room_id: data.id }),
          })
        } catch {}
      }
      router.push(`/room/${data.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      setError(message)
      console.error('Error creating room:', err)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = !!formData.name.trim() && !!formData.topic && (noLimit || (!!formData.maxMembers && Number(formData.maxMembers) >= 2 && Number(formData.maxMembers) <= 8))

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
              chat2077
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

                {/* Max Members */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Max Members</label>
                  <Input
                    name="maxMembers"
                    type="number"
                    placeholder="2-8 people"
                    value={formData.maxMembers}
                    onChange={handleInputChange}
                    min="2"
                    max="8"
                    disabled={noLimit}
                    className="rounded-xl"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      id="noLimit"
                      type="checkbox"
                      checked={noLimit}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setNoLimit(checked)
                        if (checked) {
                          setFormData(prev => ({ ...prev, maxMembers: '' }))
                        }
                      }}
                    />
                    <label htmlFor="noLimit" className="text-xs text-foreground/70">No limit</label>
                  </div>
                  <p className="text-xs text-foreground/50 mt-2">{noLimit ? 'Unlimited members can join.' : 'Set how many people can join (minimum 2, maximum 8).'}</p>
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

                <div role="radiogroup" aria-label="Room privacy" className="space-y-4 mb-8">
                  {privacyOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={formData.privacy === option.id}
                        tabIndex={formData.privacy === option.id ? 0 : -1}
                        onKeyDown={(e) => handlePrivacyKeyNav(option.id as 'public' | 'private', e)}
                        onClick={() => handlePrivacySelect(option.id as 'public' | 'private')}
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

                {formData.privacy === 'private' && (
                  <div className="mt-6">
                    <p className="font-semibold text-sm mb-3">Add Friends Now (Optional)</p>
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
                    <div className="space-y-2">
                      {friends.length === 0 ? (
                        <p className="text-xs text-foreground/60">No accepted friends found.</p>
                      ) : (
                        friends
                          .filter((f) => (f.display_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase()))
                          .map((f) => {
                          const id = f.id || f.friend_id || f.user_id
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
                  </div>
                )}

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
                    loading={loading}
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
