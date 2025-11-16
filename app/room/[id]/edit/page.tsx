'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Globe, Lock, Key, ArrowLeft, Save, Trash2 } from 'lucide-react'
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
    privacy: 'public' as 'public' | 'private' | 'invite',
    maxMembers: '',
  })

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
    { id: 'invite', icon: Key, title: 'Invite Only', desc: 'Share unique invite link with friends' },
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
      const privacy = data.is_public ? 'public' : (data.is_private ? 'private' : 'invite')
      setFormData({
        name: data.name || '',
        description: data.description || '',
        topic: data.topic || '',
        language: data.language || 'English',
        privacy,
        maxMembers: data.max_members ? String(data.max_members) : '',
      })
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
      const is_private = formData.privacy === 'private' || formData.privacy === 'invite'

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
          max_members: formData.maxMembers ? Number(formData.maxMembers) : null,
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
            <h1 className="text-xl font-bold">Edit Room</h1>
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
              <label className="block text-sm font-semibold mb-3">Max Members (Required)</label>
              <Input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                placeholder="2-8 people"
                min="2"
                max="8"
                required
                className="rounded-xl"
              />
              <p className="text-xs text-foreground/50 mt-2">Set how many people can join (minimum 2, maximum 8).</p>
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

