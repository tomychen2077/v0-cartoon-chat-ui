'use client'

import * as Popover from '@radix-ui/react-popover'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NotificationRow {
  id: string
  sender_id: string | null
  recipient_id: string
  type: string
  room_id?: string | null
  friend_request_id?: string | null
  message?: string | null
  created_at: string
  read_at?: string | null
}

export function NotificationsPopover() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState<number>(0)
  const [senders, setSenders] = useState<Record<string, any>>({})
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setItems([])
        setUnread(0)
        setSenders({})
        return
      }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
      const rows = (data || []) as any as NotificationRow[]
      setItems(rows)
      setUnread(rows.filter((r) => !r.read_at).length)
      const ids = Array.from(new Set(rows.map((r) => r.sender_id).filter((x): x is string => !!x)))
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', ids)
        const map: Record<string, any> = {}
        ;(profs || []).forEach((p: any) => { map[p.id] = p })
        setSenders(map)
      } else {
        setSenders({})
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() })))
    setUnread(0)
  }

  const markRead = async (id: string) => {
    const row = items.find((i) => i.id === id)
    if (!row || row.read_at) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
    setUnread((u) => Math.max(0, u - 1))
  }

  const acceptFriendRequest = async (id: string, friend_request_id?: string | null) => {
    if (!friend_request_id) return
    try {
      setActionLoadingId(id)
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_request_id }),
      })
      if (res.ok) {
        await markRead(id)
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, type: 'friend_request_accepted' } : i))
      }
    } catch {}
    finally { setActionLoadingId(null) }
  }

  const renderText = (n: NotificationRow) => {
    const s = n.sender_id ? senders[n.sender_id] : null
    const name = s?.display_name || s?.username || 'Someone'
    if (n.type === 'friend_request') return `${name} sent you a friend request`
    if (n.type === 'room_member_added') return `${name} added you to a private room`
    return n.message || 'Notification'
  }

  const declineFriendRequest = async (id: string, friend_request_id?: string | null) => {
    if (!friend_request_id) return
    try {
      setActionLoadingId(id)
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_request_id }),
      })
      if (res.ok) {
        await markRead(id)
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, type: 'friend_request_declined' } : i))
      }
    } catch {}
    finally { setActionLoadingId(null) }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="icon" className="rounded-full relative" aria-label="Notifications" onClick={() => { if (!open) refresh() }}>
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none font-bold">
              {unread}
            </span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="end" className="z-[70] w-[92vw] sm:w-80 max-w-[92vw] rounded-xl border border-border bg-card shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Notifications</div>
            <Button variant="outline" size="sm" className="rounded-full h-7" onClick={markAllRead} disabled={unread === 0}>
              <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
            </Button>
          </div>
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
          <div className="max-h-64 overflow-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-xs text-foreground/60">Loading…</div>
            ) : items.filter((n) => renderText(n).toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="text-xs text-foreground/60">No notifications</div>
            ) : (
              items
                .filter((n) => renderText(n).toLowerCase().includes(search.toLowerCase()))
                .map((n) => {
                  const s = n.sender_id ? senders[n.sender_id] : null
                  const name = s?.display_name || s?.username || 'Someone'
                  const isRequest = n.type === 'friend_request'
                  const isAccepted = n.type === 'friend_request_accepted'
                  const isDeclined = n.type === 'friend_request_declined'
                  return (
                    <div key={n.id} className={`flex items-center gap-3 p-2 border rounded-md ${n.read_at ? 'opacity-70' : ''}`}>
                      {n.sender_id ? (
                        <Link href={`/profile/${n.sender_id}`} className="flex items-center gap-2">
                          <img src={s?.avatar_url || '/placeholder.svg'} alt={name} className="w-6 h-6 rounded-full" />
                        </Link>
                      ) : (
                        <img src={s?.avatar_url || '/placeholder.svg'} alt={name} className="w-6 h-6 rounded-full" />
                      )}
                      <div className="min-w-0 flex-1">
                        {n.sender_id ? (
                          <Link href={`/profile/${n.sender_id}`} className="text-xs font-semibold truncate" title={name}>{name}</Link>
                        ) : (
                          <div className="text-xs font-semibold truncate" title={name}>{name}</div>
                        )}
                        <div className="text-[11px] text-foreground/70 whitespace-nowrap truncate" title={renderText(n)}>{renderText(n)}</div>
                      </div>
                      {isRequest && !n.read_at ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="rounded-full h-7" loading={actionLoadingId === n.id} onClick={async () => { await acceptFriendRequest(n.id, n.friend_request_id) }}>
                            <Check className="w-3.5 h-3.5 mr-1" /> Accept
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full h-7" loading={actionLoadingId === n.id} onClick={async () => { await declineFriendRequest(n.id, n.friend_request_id) }}>
                            <ArrowRight className="w-3.5 h-3.5 mr-1" /> Decline
                          </Button>
                        </div>
                      ) : isAccepted ? (
                        <div className="text-[11px] font-semibold text-green-600 dark:text-green-400">Accepted</div>
                      ) : isDeclined ? (
                        <div className="text-[11px] font-semibold text-destructive">Declined</div>
                      ) : n.room_id ? (
                        <Button variant="outline" size="sm" className="rounded-full h-7" onClick={async () => { await markRead(n.id); router.push(`/room/${n.room_id}`); setOpen(false) }}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="rounded-full h-7" onClick={async () => { await markRead(n.id); setOpen(false) }}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
