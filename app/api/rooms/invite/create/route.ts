import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { room_id, expires_at, max_uses } = await request.json()
    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
    }

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', room_id)
      .single()
    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    if (room.created_by !== user.id) {
      return NextResponse.json({ error: 'Only owner can create invites' }, { status: 403 })
    }

    const token = randomUUID()

    const { data: invite, error } = await supabase
      .from('room_invites')
      .insert({ room_id, token, created_by: user.id, expires_at: expires_at || null, max_uses: max_uses || null })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    return NextResponse.json(invite)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
