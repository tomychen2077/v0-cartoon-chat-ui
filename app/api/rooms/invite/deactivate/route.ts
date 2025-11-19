import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invite_id } = await request.json()
    if (!invite_id) {
      return NextResponse.json({ error: 'invite_id is required' }, { status: 400 })
    }

    const { data: invite } = await supabase
      .from('room_invites')
      .select('id, room_id, created_by, status')
      .eq('id', invite_id)
      .single()
    if (!invite) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', invite.room_id)
      .single()
    if (!room || room.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('room_invites')
      .update({ status: 'inactive' })
      .eq('id', invite_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to deactivate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

