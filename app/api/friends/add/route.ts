import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const isGuest = (user as any)?.is_anonymous || (user as any)?.app_metadata?.provider === 'anonymous'
    if (isGuest) {
      return NextResponse.json(
        { error: 'Guests cannot perform this action' },
        { status: 403 }
      )
    }

    const { friend_id } = await request.json()
    if (!friend_id) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      )
    }

    if (friend_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a friend' },
        { status: 400 }
      )
    }

    // Check if friend request already exists
    const { data: existing } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
      .single()

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends' },
          { status: 400 }
        )
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 400 }
        )
      }
    }

    // Create friend request
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        sender_id: user.id,
        recipient_id: friend_id,
        type: 'friend_request',
        friend_request_id: data.id,
      })

    if (notifErr) {
      return NextResponse.json({ success: true, data, warn: 'notification_failed' })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error adding friend:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

