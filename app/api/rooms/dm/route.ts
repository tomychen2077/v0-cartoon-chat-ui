import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isGuest = (user as any)?.is_anonymous || (user as any)?.app_metadata?.provider === 'anonymous'
    if (isGuest) {
      return NextResponse.json({ error: 'Please create an account' }, { status: 403 })
    }

    const { recipient_id } = await request.json()
    if (!recipient_id || typeof recipient_id !== 'string') {
      return NextResponse.json({ error: 'recipient_id required' }, { status: 400 })
    }
    if (recipient_id === user.id) {
      return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 })
    }

    // Find existing private room containing both members
    const { data: myRooms } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user.id)
    const { data: theirRooms } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', recipient_id)

    const mySet = new Set((myRooms || []).map((r: any) => r.room_id))
    const commonIds = (theirRooms || [])
      .map((r: any) => r.room_id)
      .filter((id: string) => mySet.has(id))

    let room
    if (commonIds.length) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('*')
        .in('id', commonIds)
        .eq('is_private', true)
        .limit(1)
      room = existing && existing[0]
    }

    if (!room) {
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .eq('id', recipient_id)
        .single()
      const title = recipient ? `Chat with ${recipient.display_name || recipient.username}` : 'Private Chat'
      const { data: created, error } = await supabase
        .from('rooms')
        .insert({
          name: title,
          description: null,
          topic: 'General',
          emoji: '💬',
          is_public: false,
          is_private: true,
          language: 'en',
          max_members: null,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      room = created
      await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id })
      await supabase.from('room_members').insert({ room_id: room.id, user_id: recipient_id })
      await supabase.from('notifications').insert({ sender_id: user.id, recipient_id, type: 'room_member_added', room_id: room.id })
    }

    return NextResponse.json({ room_id: room.id })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

