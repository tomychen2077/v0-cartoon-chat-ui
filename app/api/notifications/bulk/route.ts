import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isGuest = (user as any)?.is_anonymous || (user as any)?.app_metadata?.provider === 'anonymous'
    if (isGuest) {
      return NextResponse.json({ error: 'Guests cannot perform this action' }, { status: 403 })
    }

    const { recipients, type, room_id, message } = await request.json()
    const list: string[] = Array.isArray(recipients) ? recipients.filter((x) => typeof x === 'string') : []
    const t: string = typeof type === 'string' ? type : ''
    if (!list.length || !t) {
      return NextResponse.json({ error: 'recipients and type are required' }, { status: 400 })
    }

    const rows = list.map((rid) => ({
      sender_id: user.id,
      recipient_id: rid,
      type: t,
      room_id: room_id || null,
      message: message || null,
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(rows)

    if (error) {
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

