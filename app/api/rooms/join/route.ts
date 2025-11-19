import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { room_id, token } = await request.json()
    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
    }

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single()

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const isOwner = room.created_by === user.id
    let inviteRow: any = null
    if (room.is_private && !isOwner) {
      if (!token) {
        return NextResponse.json({ error: 'Invite required' }, { status: 403 })
      }
      const { data: inviteList } = await supabase
        .from('room_invites')
        .select('*')
        .eq('token', token)
        .eq('room_id', room_id)
        .eq('status', 'active')
        .limit(1)
      const invite = Array.isArray(inviteList) ? inviteList[0] : null
      const now = new Date()
      const expired = invite?.expires_at ? new Date(invite.expires_at) < now : false
      const reached = invite?.max_uses ? (invite.uses || 0) >= invite.max_uses : false
      if (!invite || expired || reached) {
        return NextResponse.json({ error: 'Invalid invite' }, { status: 403 })
      }
      inviteRow = invite
    }

    const { data: members } = await supabase
      .from('room_members')
      .select('id, user_id')
      .eq('room_id', room_id)

    const currentCount = (members?.length ?? 0)
    const max = (room as any)?.max_members ?? null
    if (max && currentCount >= max) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 })
    }

    const alreadyMember = (members || []).some((m: any) => m.user_id === user.id)
    if (alreadyMember) {
      return NextResponse.json({ success: true })
    }

    const { error: insertErr } = await supabase
      .from('room_members')
      .insert({ room_id, user_id: user.id })

    if (insertErr) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
    }

    if (room.is_private && !isOwner && token && inviteRow) {
      await supabase
        .from('room_invites')
        .update({ uses: (inviteRow.uses || 0) + 1, status: (inviteRow.max_uses && (inviteRow.uses + 1) >= inviteRow.max_uses) ? 'inactive' : 'active' })
        .eq('id', inviteRow.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
