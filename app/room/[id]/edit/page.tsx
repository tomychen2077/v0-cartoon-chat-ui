'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Globe, Lock, ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Room {
  id: string
  name: string
  description?: string
  topic: string
  emoji: string
  is_public: boolean
  is_private: boolean
  language: string
  max_members?: number
}

export default function EditRoom() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const supabase = createClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    language: 'English',
    privacy: 'public' as 'public' | 'private',
    maxMembers: '',
  })
  const [noLimit, setNoLimit] = useState(false)

  const [inviteCreating, setInviteCreating] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [invites, setInvites] = useState<any[]>([])

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
    { id: 'public', icon: Globe, title: 'Public', desc: 'Anyone can discover and join' },
    { id: 'private', icon: Lock, title: 'Private', desc: 'Only invited members can join' },
  ]

  useEffect(() => {
    loadRoom()
  }, [roomId])

  const loadRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) throw error

      if (data.created_by !== user.id) {
        setError('You can only edit rooms you created')
        return
      }

      setRoom(data)
      const privacy = data.is_public ? 'public' : 'private'
      setFormData({
        name: data.name || '',
        description: data.description || '',
        topic: data.topic || '',
        language: data.language || 'English',
        privacy,
        maxMembers: data.max_members ? String(data.max_members) : '',
      })
      setNoLimit(!data.max_members)
    } catch (err) {
      console.error('Error loading room:', err)
      setError('Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.topic) {
      setError('Name and topic are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const selectedTopic = topics.find(t => t.name === formData.topic)
      const emoji = selectedTopic?.emoji || '💬'
      const is_public = formData.privacy === 'public'
      const is_private = formData.privacy === 'private'

      const response = await fetch('/api/rooms/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          topic: formData.topic,
          emoji,
          is_public,
          is_private,
          language: formData.language,
          max_members: noLimit ? null : (formData.maxMembers ? Number(formData.maxMembers) : null),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      router.push(`/room/${roomId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update room'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/rooms/delete?id=${roomId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete room')
      }

      router.push('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room'
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateInvite = async () => {
    setInviteCreating(true)
    setInviteError(null)
    setInviteToken(null)
    try {
      const payload: any = { room_id: roomId }
      const res = await fetch('/api/rooms/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invite')
      setInviteToken(data.token)
      await loadInvites()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create invite'
      setInviteError(msg)
    } finally {
      setInviteCreating(false)
    }
  }

  const loadInvites = async () => {
    try {
      const res = await fetch(`/api/rooms/invite/list?room_id=${roomId}`)
      const data = await res.json()
      if (res.ok) {
        setInvites(data.invites || [])
      }
    } catch {}
  }

  useEffect(() => {
    if (roomId && formData.privacy !== 'public') {
      loadInvites()
    }
  }, [roomId, formData.privacy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-destructive">Room not found or you don't have permission to edit it.</p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/room/${roomId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Room
              </Button>
            </Link>
            <h1 className="text-xl font-bold">chat2077</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        {error && (
          <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-xs sm:text-sm">{error}</p>
          </Card>
        )}

        <Card className="p-4 sm:p-8">
          <div className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-semibold mb-3">Room Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold mb-3">Topic</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {topics.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setFormData({ ...formData, topic: t.name })}
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
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-sm font-semibold mb-3">Max Members</label>
              <Input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                placeholder="2-8 people"
                min="2"
                max="8"
                disabled={noLimit}
                className="rounded-xl"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="noLimitEdit"
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
                <label htmlFor="noLimitEdit" className="text-xs text-foreground/70">No limit</label>
              </div>
              <p className="text-xs text-foreground/50 mt-2">{noLimit ? 'Unlimited members can join.' : 'Set how many people can join (minimum 2, maximum 8).'}</p>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-semibold mb-3">Privacy</label>
              <div className="space-y-4">
                {privacyOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.id}
                      onClick={() => setFormData({ ...formData, privacy: option.id as any })}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                        formData.privacy === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
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
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.privacy !== 'public' && (
              <div className="border rounded-lg p-3">
                <p className="font-semibold text-sm mb-3">Invites</p>
                {inviteError && (
                  <p className="text-xs text-destructive mb-2">{inviteError}</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Button onClick={handleCreateInvite} disabled={inviteCreating} className="rounded-full">
                    {inviteCreating ? 'Creating…' : 'Create Invite'}
                  </Button>
                  {inviteToken && (
                    <>
                      <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}?token=${inviteToken}`} />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}?token=${inviteToken}`
                          navigator.clipboard.writeText(url).catch(() => {})
                        }}
                        className="rounded-full"
                      >
                        Copy
                      </Button>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Active Invites</p>
                  <div className="space-y-2">
                    {invites.filter((i) => i.status === 'active').length === 0 ? (
                      <p className="text-xs text-foreground/60">No active invites</p>
                    ) : (
                      invites.filter((i) => i.status === 'active').map((i) => (
                        <div key={i.id} className="p-2 border rounded-md flex items-center justify-between">
                          <div className="text-xs">
                            <p className="font-semibold">{(i.token || '').slice(0, 8)}…</p>
                            <p className="text-foreground/60">Uses: {i.uses || 0}{i.max_uses ? `/${i.max_uses}` : ''}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/rooms/invite/deactivate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ invite_id: i.id }),
                                })
                                if (res.ok) { loadInvites() }
                              } catch {}
                            }}
                          >
                            Deactivate
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Room'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

